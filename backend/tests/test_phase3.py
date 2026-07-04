"""Phase 3: JWT revocation via token_version, and a migration drift check."""
import os
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]


def test_password_change_revokes_existing_token(client, admin_headers):
    # Create a judge and grab a working token.
    created = client.post(
        "/admin/users",
        json={"email": "revoke@example.com", "password": "revokepass1", "role": "judge"},
        headers=admin_headers,
    )
    uid = created.json()["id"]
    token = client.post(
        "/auth/login", data={"username": "revoke@example.com", "password": "revokepass1"}
    ).json()["access_token"]
    hdr = {"Authorization": f"Bearer {token}"}
    assert client.get("/admin/nominations", headers=hdr).status_code == 200

    # Admin resets the password → token_version bumps → old token is rejected.
    client.patch(f"/admin/users/{uid}", json={"password": "newpass12345"}, headers=admin_headers)
    assert client.get("/admin/nominations", headers=hdr).status_code == 401

    # A fresh login with the new password works again.
    new_token = client.post(
        "/auth/login", data={"username": "revoke@example.com", "password": "newpass12345"}
    ).json()["access_token"]
    assert client.get(
        "/admin/nominations", headers={"Authorization": f"Bearer {new_token}"}
    ).status_code == 200


def test_migrations_apply_cleanly_on_fresh_db():
    """Run the full Alembic chain on a clean SQLite DB and confirm the key
    Phase 0/3 columns exist. Catches model/migration drift the create_all-based
    fixtures cannot."""
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "migtest.db")
        env = dict(os.environ)
        env["DATABASE_URL"] = f"sqlite:///{db_path}"
        env["JWT_SECRET"] = "test-secret-key-at-least-32-bytes-long-000"
        env["ENVIRONMENT"] = "development"
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=_BACKEND,
            env=env,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, result.stderr

        conn = sqlite3.connect(db_path)
        try:
            vote_cols = {r[1] for r in conn.execute("PRAGMA table_info(votes)")}
            user_cols = {r[1] for r in conn.execute("PRAGMA table_info(users)")}
        finally:
            conn.close()
        assert "category_id" in vote_cols
        assert "token_version" in user_cols
