"""Phase 1 hardening: security headers, file-URL validation, CSV sanitize,
admin category/user management, and login lockout."""
import csv
import io

from tests.conftest import valid_creche_payload


def test_csp_and_headers_present(client):
    resp = client.get("/health")
    assert "Content-Security-Policy" in resp.headers
    assert resp.json()["database"] == "ok"


def test_nomination_rejects_external_file_url(client):
    payload = valid_creche_payload()
    payload["files"] = [{"field_key": "evidence", "url": "https://evil.example/phish"}]
    resp = client.post("/nominations", json=payload)
    assert resp.status_code == 422


def test_nomination_accepts_upload_url(client):
    # A real upload URL (uuid hex + ext under /uploads) is accepted.
    payload = valid_creche_payload()
    payload["files"] = [
        {"field_key": "evidence", "url": "/uploads/" + "a" * 32 + ".png"}
    ]
    resp = client.post("/nominations", json=payload)
    assert resp.status_code == 201, resp.text


def test_csv_export_neutralizes_formula_injection(client, admin_headers):
    payload = valid_creche_payload()
    payload["answers"]["creche_name"] = '=HYPERLINK("http://evil","x")'
    assert client.post("/nominations", json=payload).status_code == 201

    resp = client.get(
        "/admin/nominations/export/csv?category=creche-of-the-year", headers=admin_headers
    )
    assert resp.status_code == 200
    reader = csv.reader(io.StringIO(resp.text))
    rows = list(reader)
    nominee_col = rows[0].index("nominee")
    cells = [r[nominee_col] for r in rows[1:]]
    injected = [c for c in cells if "HYPERLINK" in c]
    assert injected and all(c.startswith("'") for c in injected)


def test_admin_can_close_nominations(client, admin_headers):
    try:
        resp = client.patch(
            "/admin/categories/creche-of-the-year",
            json={"nominations_open": False},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["nominations_open"] is False
        # Now a submission to that category is refused.
        blocked = client.post("/nominations", json=valid_creche_payload())
        assert blocked.status_code == 409
    finally:
        client.patch(
            "/admin/categories/creche-of-the-year",
            json={"nominations_open": True},
            headers=admin_headers,
        )


def test_admin_can_deactivate_user(client, admin_headers):
    # Create a judge, confirm login works, deactivate, confirm login fails.
    created = client.post(
        "/admin/users",
        json={"email": "deact@example.com", "password": "deactpass1", "role": "judge"},
        headers=admin_headers,
    )
    assert created.status_code == 201, created.text
    uid = created.json()["id"]
    assert client.post(
        "/auth/login", data={"username": "deact@example.com", "password": "deactpass1"}
    ).status_code == 200

    resp = client.patch(f"/admin/users/{uid}", json={"active": False}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["active"] is False
    assert client.post(
        "/auth/login", data={"username": "deact@example.com", "password": "deactpass1"}
    ).status_code == 401


def test_admin_cannot_deactivate_self(client, admin_headers):
    users = client.get("/admin/users", headers=admin_headers).json()
    admin_id = next(u["id"] for u in users if u["email"] == "admin@rc.test")
    resp = client.patch(f"/admin/users/{admin_id}", json={"active": False}, headers=admin_headers)
    assert resp.status_code == 422


def test_login_lockout_after_repeated_failures(client):
    email = "lockme@rc.test"
    # Default threshold is 8 failures; the 9th attempt is locked out (429).
    for _ in range(8):
        r = client.post("/auth/login", data={"username": email, "password": "nope"})
        assert r.status_code == 401
    locked = client.post("/auth/login", data={"username": email, "password": "nope"})
    assert locked.status_code == 429
