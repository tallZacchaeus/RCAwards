"""End-to-end API tests for the Phase 2 endpoints."""
from tests.conftest import valid_creche_payload


# --- Public -------------------------------------------------------------------

def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_list_and_get_categories(client):
    cats = client.get("/categories").json()
    assert len(cats) == 23
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

    # Leaderboard reflects the score
    board = client.get(
        "/admin/categories/creche-of-the-year/leaderboard", headers=admin_headers
    ).json()
    entry = next(e for e in board if e["nomination_id"] == nom_id)
    assert entry["average_total"] == 17.0 and entry["judge_count"] == 1


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
