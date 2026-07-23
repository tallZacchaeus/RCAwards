"""End-to-end API tests for the Phase 2 endpoints."""
from sqlalchemy import func, select

from tests.conftest import valid_creche_payload


# --- Public -------------------------------------------------------------------

def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_list_and_get_categories(client):
    cats = client.get("/categories").json()
    assert len(cats) == 20
    detail = client.get("/categories/creche-of-the-year").json()
    assert detail["form"]["slug"] == "creche-of-the-year"
    assert detail["form"]["sections"]


def test_signup_is_idempotent(client):
    first = client.post("/signup", json={"email": "fan@example.com"})
    second = client.post("/signup", json={"email": "FAN@example.com"})
    assert first.status_code == 200 and first.json()["subscribed"]
    assert second.json()["email"] == "fan@example.com"  # normalised, still one record


# --- Nominations --------------------------------------------------------------

def test_submit_valid_nomination(client):
    resp = client.post("/nominations", json=valid_creche_payload())
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "submitted"
    assert body["category_slug"] == "creche-of-the-year"


def test_submit_invalid_nomination_returns_field_errors(client):
    payload = valid_creche_payload()
    del payload["answers"]["creche_name"]
    payload["answers"]["staff_child_ratio"] = 99
    resp = client.post("/nominations", json=payload)
    assert resp.status_code == 422
    errors = resp.json()["detail"]["field_errors"]
    assert "creche_name" in errors and "staff_child_ratio" in errors


def test_submit_unknown_category(client):
    payload = valid_creche_payload()
    payload["category_slug"] = "does-not-exist"
    assert client.post("/nominations", json=payload).status_code == 404


def test_upload_then_attach_file(client, admin_headers):
    files = {"file": ("flyer.png", b"\x89PNG\r\n\x1a\nfake", "image/png")}
    up = client.post("/uploads", files=files)
    assert up.status_code == 200, up.text
    url = up.json()["url"]

    payload = valid_creche_payload()
    payload["files"] = [{"field_key": "supporting_file", "url": url, "kind": "image"}]
    created = client.post("/nominations", json=payload)
    assert created.status_code == 201

    detail = client.get(
        f"/admin/nominations/{created.json()['id']}", headers=admin_headers
    ).json()
    assert detail["files"][0]["url"] == url


def test_upload_rejects_unsupported_type(client):
    files = {"file": ("evil.exe", b"MZ", "application/x-msdownload")}
    assert client.post("/uploads", files=files).status_code == 415


# --- Auth ---------------------------------------------------------------------

def test_login_rejects_bad_password(client):
    resp = client.post("/auth/login", data={"username": "admin@rc.test", "password": "wrong"})
    assert resp.status_code == 401


def test_me_returns_current_user(client, judge_headers):
    me = client.get("/auth/me", headers=judge_headers).json()
    assert me["email"] == "judge@rc.test" and me["role"] == "judge"


def test_admin_endpoints_require_auth(client):
    assert client.get("/admin/nominations").status_code == 401


def test_judge_cannot_change_status(client, judge_headers):
    created = client.post("/nominations", json=valid_creche_payload()).json()
    resp = client.patch(
        f"/admin/nominations/{created['id']}",
        json={"status": "shortlisted"},
        headers=judge_headers,
    )
    assert resp.status_code == 403


# --- Admin / judging ----------------------------------------------------------

def test_full_judging_flow(client, admin_headers, judge_headers):
    created = client.post("/nominations", json=valid_creche_payload()).json()
    nom_id = created["id"]

    # Judge scores it
    score = client.post(
        f"/admin/nominations/{nom_id}/scores",
        json={"criteria": {"staff_child_ratio": 8, "cleanliness_safety": 9}},
        headers=judge_headers,
    )
    assert score.status_code == 200
    assert score.json()["total"] == 17

    # Admin shortlists it
    patched = client.patch(
        f"/admin/nominations/{nom_id}",
        json={"status": "shortlisted"},
        headers=admin_headers,
    )
    assert patched.status_code == 200 and patched.json()["status"] == "shortlisted"

    # Leaderboard reflects the score: per-criterion averages + a ranked score.
    board = client.get(
        "/admin/categories/creche-of-the-year/leaderboard", headers=admin_headers
    ).json()
    entry = next(e for e in board if e["nomination_id"] == nom_id)
    assert entry["judge_count"] == 1
    assert entry["ranked_score"] > 0 and entry["panel_size"] >= 1
    # Sheet convention: per-criterion average = (sum of scores) ÷ full panel size,
    # and the Ranked Score is the sum of those averages.
    panel = entry["panel_size"]
    by_key = {c["key"]: c["average"] for c in entry["criteria"]}
    assert by_key["staff_child_ratio"] == round(8 / panel, 2)
    assert by_key["cleanliness_safety"] == round(9 / panel, 2)
    assert entry["ranked_score"] == round(17 / panel, 2)


def test_score_rejects_unknown_criterion(client, judge_headers):
    nom_id = client.post("/nominations", json=valid_creche_payload()).json()["id"]
    resp = client.post(
        f"/admin/nominations/{nom_id}/scores",
        json={"criteria": {"not_a_real_criterion": 8}},
        headers=judge_headers,
    )
    assert resp.status_code == 422
    assert "not a judging criterion" in resp.json()["detail"]


def test_category_criteria_endpoint(client, admin_headers):
    crit = client.get(
        "/admin/categories/creche-of-the-year/criteria", headers=admin_headers
    ).json()
    keys = {c["key"] for c in crit}
    # The official judging criteria are the form's 1-10 fields.
    assert "staff_child_ratio" in keys and "cleanliness_safety" in keys
    assert all("label" in c for c in crit)


def test_judging_sheet_export(client, admin_headers, judge_headers):
    created = client.post("/nominations", json=valid_creche_payload()).json()
    client.post(
        f"/admin/nominations/{created['id']}/scores",
        json={"criteria": {"staff_child_ratio": 7}},
        headers=judge_headers,
    )
    resp = client.get(
        "/admin/categories/creche-of-the-year/judging-sheet.csv", headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "NOMINEE,CRITERIA" in resp.text
    assert "Ranked Score" in resp.text


def test_csv_export(client, admin_headers):
    client.post("/nominations", json=valid_creche_payload())
    resp = client.get(
        "/admin/nominations/export/csv?category=creche-of-the-year", headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "id,category,status" in resp.text


def test_admin_creates_judge_user(client, admin_headers):
    resp = client.post(
        "/admin/users",
        json={"email": "newjudge@example.com", "password": "secretpass1", "role": "judge"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "judge"
    # New judge can log in
    login = client.post(
        "/auth/login", data={"username": "newjudge@example.com", "password": "secretpass1"}
    )
    assert login.status_code == 200


def test_ticket_availability_and_booking(client):
    availability = client.get("/tickets/availability").json()
    assert availability["available"] is True
    assert availability["remaining"] == 305

    resp = client.post(
        "/tickets",
        json={
            "first_name": "Ada",
            "last_name": "Nwosu",
            "email": "ada.nwosu@example.com",
            "location": "Redemption City",
            "website": "",
        },
    )
    assert resp.status_code == 201, resp.text
    created = resp.json()
    assert created["ticket_number"] == "RCAE-001"
    assert created["email"] == "ada.nwosu@example.com"

    availability = client.get("/tickets/availability").json()
    assert availability["remaining"] == 304


def test_ticket_sold_out(client):
    # Fill all remaining tickets then verify the booking flow rejects the next reservation.
    from app.db import SessionLocal
    from app.models import Ticket
    from sqlalchemy import delete

    session = SessionLocal()
    start_count = 0
    added_ticket_numbers = []
    try:
        start_count = int(session.scalar(select(func.count(Ticket.id))) or 0)
        for index in range(start_count + 1, 306):
            ticket_number = f"RCAE-{index:03d}"
            session.add(
                Ticket(
                    ticket_number=ticket_number,
                    first_name="Test",
                    last_name="Buyer",
                    email=f"test{index}@example.com",
                    location="Redemption City",
                )
            )
            added_ticket_numbers.append(ticket_number)
        session.commit()

        resp = client.post(
            "/tickets",
            json={
                "first_name": "Late",
                "last_name": "Guest",
                "email": "late.guest@example.com",
                "location": "Redemption City",
                "website": "",
            },
        )
        assert resp.status_code == 409
        assert "sold out" in resp.json()["detail"].lower()
    finally:
        if added_ticket_numbers:
            session.execute(
                delete(Ticket).where(Ticket.ticket_number.in_(added_ticket_numbers))
            )
            session.commit()
        session.close()


def test_admin_lists_tickets(client, admin_headers):
    created = client.post(
        "/tickets",
        json={
            "first_name": "Kemi",
            "last_name": "Adewale",
            "email": "kemi.adewale@example.com",
            "location": "Redemption City",
            "website": "",
        },
    ).json()

    tickets = client.get("/admin/tickets", headers=admin_headers).json()
    assert any(ticket["ticket_number"] == created["ticket_number"] for ticket in tickets)
