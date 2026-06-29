"""Phase 7 hardening: honeypot, security headers, and admin settings."""
from tests.conftest import valid_creche_payload


def test_honeypot_blocks_nomination(client):
    payload = valid_creche_payload()
    payload["website"] = "http://spam.example"
    assert client.post("/nominations", json=payload).status_code == 400


def test_honeypot_blocks_signup(client):
    resp = client.post("/signup", json={"email": "bot@example.com", "website": "filled"})
    assert resp.status_code == 400


def test_security_headers_present(client):
    resp = client.get("/health")
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert "Referrer-Policy" in resp.headers


def test_settings_requires_admin(client, judge_headers):
    assert client.get("/admin/settings", headers=judge_headers).status_code == 403


def test_admin_can_set_voting_window(client, admin_headers):
    # Open in the past, close in the future → voting should be open.
    resp = client.put(
        "/admin/settings",
        json={
            "voting_opens_at": "2020-01-01T00:00:00",
            "voting_closes_at": "2090-01-01T00:00:00",
            "voting_results_public": False,
        },
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["voting_results_public"] is False

    status = client.get("/voting/status").json()
    assert status["open"] is True
    assert status["results_public"] is False

    # Clear the window again so other tests see the default-open behaviour.
    client.put(
        "/admin/settings",
        json={"voting_opens_at": "", "voting_closes_at": "", "voting_results_public": True},
        headers=admin_headers,
    )


def test_settings_rejects_bad_datetime(client, admin_headers):
    resp = client.put(
        "/admin/settings",
        json={"voting_opens_at": "not-a-date"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
