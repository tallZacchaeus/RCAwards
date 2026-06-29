"""Voting flow: admin builds a slate, the public votes, anti-fraud holds."""
from app.db import SessionLocal
from app.models import Setting


def _make_nominee(client, admin_headers, name="Little Lights"):
    resp = client.post(
        "/admin/nominees",
        json={"category_slug": "creche-of-the-year", "display_name": name},
        headers=admin_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _clear_voting_window():
    session = SessionLocal()
    try:
        for key in ("voting_opens_at", "voting_closes_at"):
            row = session.get(Setting, key)
            if row:
                session.delete(row)
        session.commit()
    finally:
        session.close()


def _set_setting(key: str, value: str):
    session = SessionLocal()
    try:
        row = session.get(Setting, key)
        if row:
            row.value = value
        else:
            session.add(Setting(key=key, value=value))
        session.commit()
    finally:
        session.close()


def test_create_and_list_nominees(client, admin_headers):
    nominee_id = _make_nominee(client, admin_headers, "Bright Beginnings")
    nominees = client.get("/nominees?category=creche-of-the-year").json()
    assert any(n["id"] == nominee_id for n in nominees)
    assert all("vote_count" in n for n in nominees)


def test_vote_succeeds_and_counts(client, admin_headers):
    _clear_voting_window()
    nominee_id = _make_nominee(client, admin_headers, "Sunrise Crèche")
    resp = client.post(
        "/votes", json={"nominee_id": nominee_id, "voter_fingerprint": "device-aaa-1111"}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["vote_count"] >= 1


def test_one_vote_per_category_per_device(client, admin_headers):
    _clear_voting_window()
    a = _make_nominee(client, admin_headers, "Nominee A")
    b = _make_nominee(client, admin_headers, "Nominee B")
    fp = "device-bbb-2222"
    first = client.post("/votes", json={"nominee_id": a, "voter_fingerprint": fp})
    assert first.status_code == 200
    # Same device, different nominee in the SAME category → blocked.
    second = client.post("/votes", json={"nominee_id": b, "voter_fingerprint": fp})
    assert second.status_code == 409


def test_cannot_vote_twice_for_same_nominee(client, admin_headers):
    _clear_voting_window()
    nominee_id = _make_nominee(client, admin_headers, "Repeat Test")
    fp = "device-ccc-3333"
    assert client.post("/votes", json={"nominee_id": nominee_id, "voter_fingerprint": fp}).status_code == 200
    assert client.post("/votes", json={"nominee_id": nominee_id, "voter_fingerprint": fp}).status_code == 409


def test_voting_closed_window(client, admin_headers):
    nominee_id = _make_nominee(client, admin_headers, "Closed Window")
    # Window already ended in the past.
    _set_setting("voting_closes_at", "2020-01-01T00:00:00")
    resp = client.post(
        "/votes", json={"nominee_id": nominee_id, "voter_fingerprint": "device-ddd-4444"}
    )
    assert resp.status_code == 409
    assert "closed" in resp.json()["detail"].lower()
    _clear_voting_window()


def test_voting_status_endpoint(client):
    _clear_voting_window()
    status = client.get("/voting/status").json()
    assert status["open"] is True
    assert status["results_public"] is True
