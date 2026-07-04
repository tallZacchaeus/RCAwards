"""Phase 0 hardening: config guard, score merge/prefill, upload size limit."""
import io

import pytest

from app.config import Settings
from tests.conftest import valid_creche_payload

_STRONG = "a3f9c1e8b7d64f2a9c0e5b8d1f3a6c9e2b4d7f0a1c3e5b7d9f1a3c5e7b9d1f3a5"
_PROD_DB = "mysql+pymysql://rcawards:realpw@db:3306/rcawards"


def test_production_rejects_low_entropy_jwt_secret():
    # The old dev value passed the length-only guard; it must not anymore.
    with pytest.raises(ValueError):
        Settings(
            environment="production",
            jwt_secret="rcawards-2026-citybreed-jwt-secret-key-32bytes-min",
            database_url=_PROD_DB,
        )


def test_production_accepts_random_jwt_secret():
    s = Settings(environment="production", jwt_secret=_STRONG, database_url=_PROD_DB)
    assert s.is_production


def _criteria_keys(client, admin_headers, slug="creche-of-the-year"):
    resp = client.get(f"/admin/categories/{slug}/criteria", headers=admin_headers)
    assert resp.status_code == 200
    return [c["key"] for c in resp.json()]


def test_score_resubmit_merges_and_prefill_returns_it(client, admin_headers, judge_headers):
    created = client.post("/nominations", json=valid_creche_payload())
    nom_id = created.json()["id"]
    keys = _criteria_keys(client, admin_headers)
    assert len(keys) >= 2

    # First submit: only the first criterion.
    r1 = client.post(
        f"/admin/nominations/{nom_id}/scores",
        json={"criteria": {keys[0]: 6}},
        headers=judge_headers,
    )
    assert r1.status_code == 200

    # Second submit: only the second criterion — must NOT wipe the first.
    r2 = client.post(
        f"/admin/nominations/{nom_id}/scores",
        json={"criteria": {keys[1]: 9}},
        headers=judge_headers,
    )
    assert r2.status_code == 200
    assert r2.json()["criteria"].get(keys[0]) == 6
    assert r2.json()["criteria"].get(keys[1]) == 9

    # Prefill endpoint returns the judge's own merged score.
    me = client.get(f"/admin/nominations/{nom_id}/scores/me", headers=judge_headers)
    assert me.status_code == 200
    assert me.json()["criteria"].get(keys[0]) == 6
    assert me.json()["criteria"].get(keys[1]) == 9


def test_my_score_is_null_before_scoring(client, admin_headers, judge_headers):
    created = client.post("/nominations", json=valid_creche_payload())
    nom_id = created.json()["id"]
    me = client.get(f"/admin/nominations/{nom_id}/scores/me", headers=judge_headers)
    assert me.status_code == 200
    assert me.json() is None


def test_upload_rejects_oversized_file(client):
    # 11 MB of bytes exceeds the 10 MB default limit → 413, not a 200 or OOM.
    big = io.BytesIO(b"\x00" * (11 * 1024 * 1024))
    resp = client.post(
        "/uploads",
        files={"file": ("big.png", big, "image/png")},
    )
    assert resp.status_code == 413
