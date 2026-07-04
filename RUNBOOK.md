# Launch-Night Runbook — Redemption City Awards 2026

Operational guide for **event night (29 July 2026)** and the days around it.
Deployment details are in [`DEPLOY.md`](DEPLOY.md); this doc covers running it live.

---

## 1. Go / No-Go checklist (T‑24h)

- [ ] `curl https://awards.thecitybreed.org/api/health` → `{"status":"ok","database":"ok"}`.
- [ ] Response headers include `Content-Security-Policy`, `Strict-Transport-Security`,
      `X-Frame-Options` (check both the site and `/api`).
- [ ] `JWT_SECRET` is 32+ random bytes (`openssl rand -hex 32`), **not** the dev value.
      The backend refuses to start otherwise — check `docker compose logs backend`.
- [ ] Judge panel seeded with **unique** passwords (`app.manage seed-judges`), each judge
      has logged in once and changed their password.
- [ ] Voting window set in **Admin → Settings** — confirm the times read back correctly in
      the org's timezone (WAT), and that `/api/voting/status` shows the intended open/close.
- [ ] `results_public` set as intended (hidden until the reveal, if that's the plan).
- [ ] Submit a real end-to-end test: nomination **with a file upload** → shortlist → vote →
      score → leaderboard → CSV export. Delete the test data afterward.
- [ ] On a **real iPhone/Safari**: the hero trophy shows with no black box, and a HEIC photo
      upload works or gives a clear error.
- [ ] DB backup taken (see §5) and a snapshot of the Hostinger VPS is on.

## 2. Scaling & capacity

Single VPS, 2 uvicorn workers, in-process rate limiter. Known limits:

- **Rate limit is 20 req/min per real client IP per endpoint** (`RATE_LIMIT_REQUESTS`).
  A whole congregation behind one campus Wi-Fi (one NAT IP) shares that bucket. If a
  "vote now" moment is expected from one network, **temporarily raise** the limit before
  the announcement: set `RATE_LIMIT_REQUESTS=120` in `.env` and
  `docker compose -f docker-compose.prod.yml up -d backend`.
- **Per-IP vote cap** is `MAX_VOTES_PER_IP_PER_CATEGORY` (default 40) — raise it too if a
  large single-NAT audience will vote, or lower it if abuse appears.
- The limiter is **per worker** and **per process** — with 2 workers effective limits are
  ~2×, and they reset on restart. For a much larger audience, the real fix is a Redis-backed
  limiter (tracked in the audit as Phase 3+); until then, scale the numbers, not the workers.
- To handle more concurrent load, increase VPS CPU/RAM and the uvicorn `--workers` count in
  `backend/entrypoint.sh` (keep it ≤ CPU cores).

## 3. Monitoring during the event

- **Logs:** `docker compose -f docker-compose.prod.yml logs -f backend` — the app logs
  structured lines; unhandled errors log a stack trace with the request path.
- **Watch for a 429 spike** (rate-limit exhaustion — the C2-class risk). Quick check:
  ```bash
  docker compose -f docker-compose.prod.yml logs --since 5m backend | grep -c 429
  ```
  A rising count means legitimate users are being throttled — raise `RATE_LIMIT_REQUESTS`
  (§2) and redeploy the backend.
- **Health:** the backend container has a Docker healthcheck hitting `/health` (which probes
  the DB). `docker compose ps` shows `healthy` / `unhealthy`.
- **Confirm real client IPs** are seen (not Caddy's): a healthy log shows varied IPs; if every
  request looks identical, the `--proxy-headers` flag isn't taking effect — the rate limiter
  and vote anti-fraud are then degraded.

## 4. Common incidents

| Symptom | Likely cause | Action |
|---|---|---|
| Everyone gets "Too many requests" | Rate limit exhausted (shared NAT / spike) | Raise `RATE_LIMIT_REQUESTS`, redeploy backend |
| Backend won't start | Insecure config guard (weak `JWT_SECRET` / root DB creds) | Fix `.env`, redeploy; see `docker compose logs backend` |
| `/health` returns 503 | DB down / pool wedged | Check `db` container, `docker compose restart db` then `backend` |
| Votes look inflated | Ballot stuffing (fingerprints are client-supplied) | Lower `MAX_VOTES_PER_IP_PER_CATEGORY`; consider enabling a CAPTCHA (Phase 3); review `ip_hash` distribution in the DB |
| A judge account leaked | — | Admin → deactivate the user, or `app.manage reset-password --email …` (both invalidate existing tokens) |
| Voting opened/closed at the wrong time | Window set in the wrong timezone | Re-set in Admin → Settings from a machine in WAT; verify via `/api/voting/status` |

## 5. Backups

- **Before and after the event**, dump the database:
  ```bash
  docker compose -f docker-compose.prod.yml exec db \
    sh -c 'mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" rcawards' > rcawards-$(date +%F-%H%M).sql
  ```
- Uploaded evidence lives in the `uploads` volume — snapshot the VPS or copy the volume.
- Keep the post-nomination and post-voting dumps off-server (download them).

## 6. After the event

- Export final results: Admin → **Download judging sheet** (per category) and the
  nominations CSV. These open safely in Excel (formula-injection is neutralized).
- Set winners in the admin, then flip `results_public` on for the public reveal.
- Run `app.manage cleanup-uploads --min-age-hours 24` to remove orphaned upload files.
- Rotate `JWT_SECRET` and judge passwords if the panel is done.
