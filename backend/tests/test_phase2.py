"""Phase 2: validator length caps, batched vote counts, upload cleanup."""
from tests.conftest import valid_creche_payload


def test_short_text_over_cap_is_rejected(client):
    payload = valid_creche_payload()
    payload["answers"]["creche_name"] = "x" * 600  # over the 500-char short-text cap
    resp = client.post("/nominations", json=payload)
    assert resp.status_code == 422
    assert "creche_name" in resp.json()["detail"]["field_errors"]


def test_nomination_still_succeeds_with_email_background_task(client):
    # SMTP is unconfigured in tests, so the confirmation task is a no-op and must
    # not affect the response.
    resp = client.post("/nominations", json=valid_creche_payload())
    assert resp.status_code == 201


def test_admin_nominee_list_vote_counts_are_correct(client, admin_headers):
    # Batched count query (one grouped query for all nominees) must match reality.
    def mk(name):
        r = client.post(
            "/admin/nominees",
            json={"category_slug": "creche-of-the-year", "display_name": name},
            headers=admin_headers,
        )
        return r.json()["id"]

    a = mk("Batch A")
    b = mk("Batch B")
    # Two distinct devices vote for A, none for B.
    client.post("/votes", json={"nominee_id": a, "voter_fingerprint": "batch-dev-1"})
    client.post("/votes", json={"nominee_id": a, "voter_fingerprint": "batch-dev-2"})

    nominees = {n["id"]: n for n in client.get("/admin/nominees?category=creche-of-the-year", headers=admin_headers).json()}
    assert nominees[a]["vote_count"] == 2
    assert nominees[b]["vote_count"] == 0
