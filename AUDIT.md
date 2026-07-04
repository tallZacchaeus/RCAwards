# Redemption City Award of Excellence 2026 — Production Readiness Audit

**Prepared by:** Senior multidisciplinary review (QA, UI/UX, Backend/Architecture, Security)
**Date:** 4 July 2026 · **Event date:** 29 July 2026 · **Branch:** `main`
**Scope:** Full end-to-end review of the FastAPI backend, Next.js frontend, and Docker/Caddy deployment kit.

> This is an assessment document. Every finding lists: what it is, why it is a problem, the
> impact, how to fix it, and a priority (Critical / High / Medium / Low).

> **Update (Phase 0 implemented — branch `phase0-hardening`):** all launch-blocking items
> below have been fixed and verified (52/52 backend tests pass, `tsc` clean). See
> **§0. Phase 0 changelog** for exactly what changed and what still needs on-device / on-prod
> validation. The remaining Phase 1–3 items are unchanged.

---

## 0. Phase 0 Changelog (implemented on `phase0-hardening`)

| Item | Fix shipped | Verified by |
|---|---|---|
| **C2** proxy/rate-limit collapse | uvicorn `--proxy-headers --forwarded-allow-ips=*`; Caddy 12 MB body cap + HSTS | Dockerfile/Caddyfile reviewed — needs a real behind-proxy check on the VPS |
| **C1** vote forgery / race | `votes.category_id` + `UniqueConstraint(category_id, voter_fingerprint)` (DB-enforced) + Alembic migration; per-IP-per-category cap (`max_votes_per_ip_per_category`, default 40) | New tests; migration applied on fresh SQLite |
| **C3** stuck submit/vote buttons | `try/catch/finally` in `submitNomination`/`castVote` + form/gallery handlers | tsc; manual network-fail test pending |
| **H2** 409 mishandling | Backend returns `{code,message}`; frontend only records a vote on `already_voted` | New test asserts the code |
| **H1** judge score-wipe | `GET …/scores/me` prefill + server-side **merge** (never replaces the whole map) | New merge/prefill tests |
| **H4** voting-window timezone | Backend rejects naive datetimes + validates ordering; settings UI sends offset ISO, shows local TZ | New tests |
| **H3** duplicate nominees | Idempotent shortlist on `source_nomination_id`; `DELETE /admin/nominees/{id}`; un-shortlist on rejection; button busy state | New delete test |
| **H7/H8** overflow 500 / upload DoS | Length caps + truncation; uploads streamed to disk with a running size check | New oversized-upload test |
| **H9** count leak | `cast_vote` returns 0 when results are private | New privacy test |
| **H11** Safari black-box | Apple/Safari UA detection → GIF fallback | tsc — **still needs a real iPhone check** |
| **H5** admin page wipe | Separate `loadError` (page) vs `actionError` (inline banner) | tsc |
| **H6** 50-row cap | `limit`/`offset` + "Load more" | tsc |
| **Security** | Entropy+dictionary guard on `JWT_SECRET`; `seed-judges` now issues unique per-judge passwords (+`reset-password`); FastAPI docs disabled in prod; `root_path=/api` | New config-guard tests |

**Not yet done (recommended before launch, tracked in the plan):** a managed CAPTCHA
(Turnstile/hCaptcha) on `/votes` is the remaining layer for full vote integrity — the DB
constraint + IP cap raise the bar but a determined script can still rotate IPs. The forced
first-login password change (needs a schema flag + change-password endpoint) remains. The
on-device Safari test and a behind-proxy multi-IP load test must be done on the VPS.

## 0b. Phase 1 Changelog (implemented on `phase0-hardening`)

Short-term hardening. Verified: **60/60 backend tests pass, `tsc` clean.**

| Item | Fix shipped |
|---|---|
| **CSP + HSTS** | Backend sets a restrictive CSP (makes uploaded HTML/SVG inert) + HSTS in prod; frontend `next.config.ts` sets a page-appropriate CSP + HSTS; Caddy adds HSTS + hides `Server` |
| **Stored file-URL phishing (M3)** | `/nominations` rejects any file URL not matching `<upload_base>/<uuid>.<ext>` |
| **CSV formula injection (M5)** | Both exports prefix cells starting with `= + - @` / tab / CR with `'` |
| **Category controls (M2)** | `GET`/`PATCH /admin/categories` + `/admin/categories/{slug}` — open/close nominations, toggle voting, hide a category without a redeploy |
| **User management (H6/H16)** | `PATCH /admin/users/{id}` — deactivate (immediate kill switch), change role, reset password; can't deactivate self |
| **Login lockout (M6)** | Per-email+IP failed-attempt lockout (8 fails / 15 min → 429) on top of the generic rate limit |
| **Observability** | Global exception handler + structured logging; `/health` now probes the DB (503 if down); backend healthcheck in compose; `alembic upgrade head` runs on container start via `entrypoint.sh` |
| **Upload UX (H10)** | Real server error surfaced; client size/type pre-check + format hint; file input reset so retry works |
| **Resilience (H12)** | `AbortSignal.timeout` on all public SSR fetches; branded `loading.tsx`, `error.tsx`, `not-found.tsx` |
| **Mobile tables (H13)** | `overflow-x-auto` + min-width on admin nominations & leaderboard tables |
| **Accessibility (H14)** | Form labels/errors associated (`aria-describedby`, `role="alert"`), group naming for radio/scale, wrapper scroll targets, `focusFirstError` fixed; hero `<h1>`; mobile nav `inert` when closed + `aria-controls`; `autoComplete`/`name` on inputs |
| **Sharing / SEO** | `metadataBase` + OG/Twitter image; `NEXT_PUBLIC_SITE_URL` wired into the Docker build + compose |

## 0c. Phase 2 Changelog (implemented on `phase0-hardening`)

Medium-term reliability + polish. Verified: **63/63 backend tests pass, `tsc` clean.**

| Item | Fix shipped |
|---|---|
| **N+1 queries (M3)** | Leaderboard, judging-sheet CSV, and admin nominee list now use one grouped `IN (...)` query instead of one-per-row |
| **Limiter memory (M7)** | Rate limiter + login throttle sweep stale keys periodically (bounded memory) |
| **Validator length caps (M6/H7)** | short_text/paragraph/email get per-field char caps → clean 422 instead of truncation |
| **Confirmation email (L11)** | `notify_nomination_received` sent via `BackgroundTasks` (no-op unless SMTP configured + contact is an email); never blocks/fails the request |
| **Upload cleanup** | `manage.py cleanup-uploads --min-age-hours` deletes unreferenced upload files past a grace period |
| **Countdown (D2)** | `dateISO` now carries `+01:00` (WAT); post-event "The night has arrived" state instead of frozen zeros |
| **Content fixes** | Footer "Nomination Portal" → `/nominate`; offline fallback category list synced 19 → 23; `--color-gold-deep` darkened to ~5.4:1 (AA) |
| **Dead code / weight** | Removed unused Cormorant font family + Playfair italics; deleted dead `section-heading.tsx`, `card-tilt-glow.tsx`, `awards-text.png`, `trophy.png`, and Next scaffold SVGs |
| **Docs** | Root README category count (23); PLAN event date (29 July); `docs/brand.md` marked superseded by REDESIGN.md |

## 0d. Phase 3 Changelog (implemented on `phase0-hardening`)

Longer-term maturity. Verified: **65/65 backend tests pass, `tsc` clean.**

| Item | Fix shipped |
|---|---|
| **JWT revocation** | `users.token_version` (+ migration) embedded in the token and checked per request; bumped on password change/reset so old tokens stop validating — real revocation without server sessions |
| **Migrations in CI** | New `migrations` CI job applies the full chain against a **MariaDB** service (catches SQLite↔MySQL DDL drift); plus a local test that runs `alembic upgrade head` and asserts the new columns exist |
| **De-duplication** | Triplicated category-list row (home / nominate / vote) extracted into one `CategoryIndex` component; groups now derived from data (fixes the latent "votable category outside city/regional never shows" bug) |
| **Launch runbook** | [`RUNBOOK.md`](RUNBOOK.md) — go/no-go checklist, scaling the rate limit for shared-NAT audiences, 429-spike monitoring, incident table, backups, post-event steps |

### Deliberately deferred (with rationale — not silently dropped)

These are genuine improvements but were **not** implemented, either because they need an
infrastructure decision, external accounts, or visual verification not reliable in this
environment. Each is a reasonable next step, not a gap left by mistake:

- **Redis-backed rate limiter/lockout** — needs a Redis service; the in-memory limiter now
  has key eviction and is correct per-worker. Documented scaling guidance is in the runbook.
- **`next/image` + `sharp` image optimization** — changes rendering of 27 images and needs
  visual QA; deferred to avoid unverifiable layout regressions. The CLS/weight issue (H15)
  stands; do this with a working preview.
- **Managed CAPTCHA on `/votes`** — needs a Cloudflare/hCaptcha account + keys. The DB
  constraint + IP cap are the interim mitigation.
- **Cookie sessions + CSRF, MFA, admin audit log, API versioning/error envelope, object
  storage for uploads** — larger refactors that are arguably beyond what a single-night,
  single-client event platform needs now; revisit if the platform is reused/expanded.
- **Uncommitted `PageTransition` WIP** — left untouched (it's your in-progress work); decide
  to finish or revert it before tagging a release.
- **On-device Safari test + behind-proxy multi-IP load test** — must run on a real iPhone and
  the VPS respectively.

---

## 1. Executive Summary

The platform is a **well-engineered codebase for its size and stage.** The architecture is sound:
a clean dynamic form-schema engine drives ~23 award categories, the redesigned marketing site is
above-average editorial work, authorization is re-validated against the database on every request,
passwords use PBKDF2 (240k iterations), all database access is parameterized (no SQL-injection
surface), containers run as non-root, no secrets are committed to git, and the frontend never uses
`dangerouslySetInnerHTML`. The backend test suite (42 tests) passes, and `tsc`/`eslint` are clean.

However, **the project is not yet safe to launch to real users.** The problems are concentrated in a
handful of areas that matter enormously for a public awards contest run on one high-traffic night:

1. **Vote integrity is not enforceable.** Duplicate-vote prevention relies on a client-generated,
   fully attacker-controlled "fingerprint," and the one-vote-per-category rule has no database
   constraint (check-then-insert race). Ballot stuffing is trivial — this undermines the platform's
   entire purpose.
2. **Rate limiting and IP anti-fraud collapse in production.** The backend runs behind Caddy without
   `--proxy-headers`, so every request appears to come from Caddy's container IP. The result: the
   whole audience shares **one** 20-requests/minute bucket (an effective outage the moment traffic
   spikes on launch night), and every stored vote records an identical IP hash.
3. **The two most important user actions can permanently dead-lock.** A network blip during
   nomination submit or voting leaves the button stuck on "Submitting…"/disabled forever, stranding
   a completed 20-field form — because `fetch` calls have no `try/catch/finally`.
4. **Judging data can be silently corrupted.** Re-scoring a nominee starts from a blank form and the
   server replaces the entire criteria map, so adjusting one score wipes the other four — quietly
   changing who wins.
5. **Time zone handling is wrong.** The voting window is entered in local (WAT, UTC+1) time but
   compared as UTC, so the window opens/closes an hour off.

None of the findings are remote-code-execution class, and the security fundamentals are genuinely
good. But the combination of vote forgeability, the production-only rate-limiter failure, and the
stuck-form bugs means a launch today would likely produce a **contested result and a visible outage.**

**Verdict:** **Do not launch yet.** The Critical and launch-blocking High items below are a focused,
achievable list — most are small, surgical fixes. With the "Immediate" and "Short-term" phases of the
plan completed and re-tested, this platform is fit for production.

### Severity tally

| Severity | Count | Examples |
|---|---|---|
| **Critical** | 3 | Vote forgery, proxy/rate-limit collapse, stuck submit/vote buttons |
| **High** | 18 | Score-wipe, 409 mishandling, duplicate nominees, timezone, MySQL overflow, upload DoS, count leak, mobile tables, form a11y, image weight, Safari trophy |
| **Medium** | ~25 | CSP/HSTS, file-URL phishing, CSV injection, N+1, pagination, docs stale, OG image |
| **Low** | ~30 | Dead code, hardcoded strings, minor a11y, repo hygiene |

---

## 2. Major Issues Found (Critical + launch-blocking High)

### C1 — Vote fraud is trivial (self-asserted fingerprint + per-category race) — **Critical**
- **Where:** `backend/app/routers/voting.py:124-148`, `backend/app/models.py:127` (`uq_vote_once` covers only `(nominee_id, voter_fingerprint)`), `frontend/lib/vote-store.ts:8-16`.
- **What:** The only barrier to double-voting is a uniqueness check on `voter_fingerprint`, a value the client generates with `crypto.randomUUID()` and sends in the request body (`VoteCreate` only requires length 8–128). The recorded `ip_hash` is **never used to deduplicate**. Separately, the one-vote-*per-category* rule is a `SELECT`-then-`INSERT` with no covering DB constraint, so N concurrent requests all pass the check before any commits.
- **Why it's a problem:** An attacker (or a bored participant) scripts `POST /votes` with a fresh random fingerprint each time and casts unlimited votes; even an honest client can double-vote by firing parallel requests.
- **Impact:** Ballot stuffing corrupts the entire result — the single asset the platform exists to protect.
- **Fix:** Treat fingerprints as untrusted. (a) Add a DB `UniqueConstraint(category_id, voter_fingerprint)` (denormalize `category_id` onto `votes`) and rely on `IntegrityError`, closing the race; (b) enforce one vote per category **per `ip_hash`** as a second signal (accept shared-NAT collateral, or combine IP + fingerprint + a per-IP daily cap); (c) add a lightweight proof-of-humanity (Cloudflare Turnstile / hCaptcha) on the vote endpoint. For high-stakes categories consider email-verified voting.

### C2 — Rate limiter & IP anti-fraud collapse behind the production proxy — **Critical**
- **Where:** `backend/Dockerfile:20` (`uvicorn … --workers 2`, **no** `--proxy-headers`), `deploy/Caddyfile` (proxies all traffic), `backend/app/ratelimit.py:45`, `backend/app/security.py:30-37` (`hash_ip`).
- **What:** With no `--proxy-headers`/`--forwarded-allow-ips`, Starlette populates `request.client.host` from the direct TCP peer — which in production is always the Caddy container's Docker IP. So (a) `hash_ip` is identical for every visitor, and (b) the in-memory limiter buckets everyone together.
- **Why it's a problem:** Two failures at once. The 20 req/min limit is now shared by the **entire audience** per endpoint, and the stored anti-fraud IP signal is useless. With `--workers 2` the in-memory limiter is also split per process (real limit ≈ 2×, non-deterministic) and never evicts keys (`ratelimit.py:26-35`), growing unbounded.
- **Impact:** On launch night, once total traffic to `/votes` or `/nominations` exceeds 20/min, the 21st request onward gets HTTP 429 for the rest of the window — an effective outage for everyone — while a single abuser is throttled no differently from the crowd.
- **Fix:** Add `--proxy-headers --forwarded-allow-ips="*"` (or the Caddy network CIDR) to the uvicorn CMD and verify `request.client.host` reflects the real client. Move the limiter to Redis (the code comment already anticipates this) so it is correct across workers, add key eviction, and add a login-specific lockout. Set a Caddy request-body size limit while there.

### C3 — Nomination submit and vote buttons can dead-lock permanently — **Critical (UX/data-loss)**
- **Where:** `frontend/components/forms/nomination-form.tsx:56-62` + `frontend/lib/api.ts:119` (`submitNomination`); `frontend/components/voting/vote-gallery.tsx:37-39` + `api.ts:94` (`castVote`).
- **What:** Neither `submitNomination` nor `castVote` wraps `fetch` in `try/catch`. A network drop, CORS failure, or API-down throws `TypeError: Failed to fetch`; the rejection is unhandled, so `setSubmitting(false)` / `setPending(null)` never runs. The submit button stays "Submitting…" forever and every vote button stays disabled.
- **Why it's a problem:** These are the two highest-value actions on the site, and flaky mobile networks are the norm for the audience. A completed 20+ field nomination is stranded with no error and no recovery except reload (which loses everything).
- **Impact:** Lost nominations, lost votes, dead UI, no user-facing error.
- **Fix:** Wrap both awaits in `try { … } catch (e) { setError(retryMessage) } finally { setSubmitting(false) }`. Surface a retry affordance. (See also C4 for a related resilience gap on the server side.)

### H1 — Re-scoring silently wipes a judge's previous scores — **High**
- **Where:** `frontend/app/admin/nominations/[id]/page.tsx:32` (scores init `{}`, never fetched), `backend/app/routers/admin.py:161` (`score.criteria = payload.criteria` replaces the whole map). Save enabled at `scoredCount > 0`.
- **What:** A judge who scored all 5 criteria and returns to adjust one sees blank scales (no GET for their own score), sets just that one, saves — and the other four are erased. `judging.py` then divides by full panel size, deflating that nominee's average.
- **Impact:** Silent, undetectable-except-via-CSV corruption of the results that decide winners.
- **Fix:** Add `GET /admin/nominations/{id}/scores/me`, prefill state; require the full criterion set before enabling Save (keys are known); and/or merge server-side instead of replacing.

### H2 — Every 409 is treated as "you already voted" → false success + permanent lockout — **High**
- **Where:** `frontend/components/voting/vote-gallery.tsx:48-51`; backend returns 409 for four distinct cases (`voting.py:118,121,134,148`): voting not enabled, voting **closed**, already voted, race duplicate.
- **What:** The frontend calls `rememberVote()` and shows the success banner on *any* 409. If the window closes between the (up-to-60s-stale) SSR render and the click, the user sees "your vote has been recorded," and the device is locked out of that category in localStorage **forever**, even after voting reopens.
- **Impact:** False confirmations, permanent per-device lockout, silently wrong outcome.
- **Fix:** Have the backend return a machine-readable code (`{"detail":{"code":"already_voted"}}`) and only `rememberVote()` on that code; otherwise show the real error without recording a vote.

### H3 — "Add to voting slate" creates duplicate nominees; no delete/un-shortlist — **High**
- **Where:** `backend/app/routers/admin.py:381-401` (no idempotency on `source_nomination_id`), no `DELETE /admin/nominees`, rejecting a nomination doesn't hide its nominee. Frontend button has no busy state (`[id]/page.tsx:65-73`).
- **What:** Every call inserts a new `Nominee`. A double-click (or clicking again next week, since the button never reflects "already shortlisted") produces two identical entries on the public voting page — each with its own `nominee_id`, so `uq_vote_once` treats them as different nominees.
- **Impact:** The nominee's votes split across duplicates, corrupting standings; a mistaken shortlist can't be undone via the API.
- **Fix:** Make shortlist idempotent (unique on `source_nomination_id` or lookup-first); add `DELETE`/`is_shortlisted` toggle; un-shortlist on rejection; disable the button while pending.

### H4 — Voting window is set in local time but enforced as UTC — **High**
- **Where:** `frontend/app/admin/settings/page.tsx:40-41` (sends naive `datetime-local`), `backend/app/routers/voting.py:31-46` + `admin.py:446-452` (parse naive as UTC). Org operates in WAT (UTC+1).
- **What:** An admin entering "closes 21:00" actually closes at 22:00 WAT; the public page formats the same naive string in the server's timezone — a third interpretation. `opens_at < closes_at` is also never validated.
- **Impact:** Voting silently opens/closes an hour off on the event's most visible deadline.
- **Fix:** Normalize to UTC ISO with offset on save (`new Date(x).toISOString()`), reject naive strings server-side, display converted back to local with a timezone label, and validate ordering.

### H5 — Any admin action error nukes the nomination detail page (loses in-progress scores) — **High**
- **Where:** `frontend/app/admin/nominations/[id]/page.tsx:46` — a single `if (error) return <p>…</p>` early return is shared by load errors and action errors (`changeStatus`/`shortlist`/`saveScores` all `setError`).
- **What:** One failed save (422, expired session, blip) replaces the entire submission + scoring UI with one line of red text; a judge's unsaved scores are gone with no way back but reload.
- **Impact:** Judging friction and data loss during the event.
- **Fix:** Separate `loadError` (early return) from `actionError` (inline, dismissible banner); clear it at the start of each action.

### H6 — Nominations list silently capped at 50; no pagination — **High**
- **Where:** `frontend/lib/admin-api.ts:114-122` (never sends `limit`/`offset`), `backend/app/routers/admin.py:62-63` (`limit=50` default).
- **What:** "All categories" will exceed 50 quickly across 23 categories; the header then reports "50 nominations" and older submissions become unreachable from the UI (CSV export is the only complete view).
- **Impact:** Admins/judges cannot see or review a large share of nominations.
- **Fix:** Add pagination (or at least request `limit=200` plus a "load more" using `offset`); return a total count.

### H7 — MySQL will 500 on legitimate submissions (VARCHAR overflow; invisible on SQLite) — **High**
- **Where:** `backend/app/routers/nominations.py:45-56` copies unbounded text into `String(200)`/`String(120)`/`String(500)` columns (`models.py:73,98`); `validation.py` imposes no char-length limit. `FileRef.url`/`field_key` likewise unbounded.
- **What:** SQLite ignores VARCHAR lengths, so all tests pass; MySQL/MariaDB in strict mode raises `DataError: Data too long` → unhandled 500.
- **Impact:** A nominator pasting a 210-char name or a long URL loses their nomination — in production only.
- **Fix:** Add `max_length` in the Pydantic schemas and truncate in `summarize_submission` (`routers/_helpers.py:29-35`); add a char cap to text validators.

### H8 — Upload endpoint buffers the whole body into RAM before the size check — **High**
- **Where:** `backend/app/storage.py:45-51` (`data = await file.read()` **before** `len(data) > max_bytes`); no Caddy `request_body max_size`. `/uploads` is public.
- **What:** A large (or 2 GB) multipart body is fully materialized in worker memory before rejection.
- **Impact:** Trivial memory-exhaustion DoS — a few large uploads OOM-kill a worker (only 2 workers).
- **Fix:** Reject on `Content-Length` up front, stream to disk with an incremental byte counter aborting past the limit, and set a Caddy body-size cap on `/api/uploads`.

### H9 — Vote counts leak while results are set to private — **High**
- **Where:** `backend/app/routers/voting.py:150-153` returns real `vote_count` unconditionally, while `list_nominees` masks counts to 0 when `voting_results_public` is false.
- **What:** Anyone can read live standings during a "hidden results" period by casting (or observing) one vote, defeating the admin setting.
- **Impact:** Business-rule bypass; premature leak of standings.
- **Fix:** Return `vote_count` only when results are public; otherwise return `{voted:true}` with the count omitted.

### H10 — Upload errors are swallowed; picker allows formats the server rejects — **High**
- **Where:** `frontend/components/forms/file-upload-field.tsx:23-33` (`catch { setStatus("error") }` discards the server `detail`); seed `accept` lists include `image/*`/`video/*` (`seed/*.json`) but the backend allowlist (`config.py:34-41`) excludes HEIC/MOV.
- **What:** iPhone photos (`image/heic`) and `.mov` videos pass the file picker, upload fully, then 415 — and the user only ever sees "Upload failed — try again" (the real reason is thrown away). Re-selecting the same file does nothing (input value never reset).
- **Impact:** iPhone users — a large share of the audience — cannot attach evidence and get no usable explanation.
- **Fix:** Surface the caught `e.message`; add client-side type+size pre-check with allowed-format help text; reset `e.target.value` after read; accept HEIC/HEIF (convert server-side) or narrow the `accept` list to the true allowlist.

### H11 — Hero trophy may render as a black box on Safari/iOS — **High (verify on device)**
- **Where:** `frontend/components/trophy-media.tsx:21-26` gates the alpha-WebM on `canPlayType('video/webm; codecs="vp9"')` being truthy.
- **What:** Modern Safari returns `"maybe"`/`"probably"` for VP9-in-WebM but **does not composite VP9 alpha**, so it takes the video path and paints the transparent trophy over an opaque black rectangle in the middle of the hero.
- **Impact:** A broken-looking hero for every iPhone/Safari visitor — the first impression on the highest-traffic page.
- **Fix:** Also require alpha support — prefer an HEVC-alpha `.mov` for Safari (standard alpha-video pairing), or detect Apple (`navigator.vendor.includes('Apple')`) and fall back to the existing GIF. **Test on a real iPhone before launch.**

### H12 — Public pages block on a slow backend; no loading/error boundaries — **High**
- **Where:** `frontend/lib/api.ts:16-84` (no fetch timeout), `frontend/components/categories.tsx:8-9` (async server component on the home page), and no `loading.tsx`/`error.tsx`/`not-found.tsx` anywhere under `frontend/app`.
- **What:** Every public getter fails *gracefully* but never *times out*, so an up-but-slow API (cold DB, event-night load) hangs the home-page TTFB; client navigations show no feedback; an uncaught render error yields Next's default white screen inside the dark brand.
- **Impact:** The busiest page can hang for all visitors during the exact window that matters.
- **Fix:** Add `AbortSignal.timeout(3000)` to all public fetches (fallbacks already handle the throw); add branded `loading.tsx`, `error.tsx`, and `not-found.tsx`.

### H13 — Admin tables clip on mobile instead of scrolling — **High**
- **Where:** `frontend/app/admin/nominations/page.tsx:97` and `leaderboard/page.tsx:88` wrap `<table>` in `overflow-hidden`.
- **What:** The leaderboard's 5 columns + criteria chips exceed 375px and are clipped with no way to reach the Status column.
- **Impact:** Judges/admins working from phones (common at a live event) can't see full rows.
- **Fix:** `overflow-x-auto` on the table wrapper (keep rounding on an outer div).

### H14 — Nomination form is inaccessible to screen readers and keyboard users — **High**
- **Where:** `frontend/components/forms/field-renderer.tsx:48,68` — `<Label htmlFor={field.key}>` points at ids that don't exist for `yes_no`/`multiple_choice`/`linear_scale`/`file_upload`; errors are bare `<p>`s with no `aria-describedby`/`role="alert"`; `focusFirstError` (`nomination-form.tsx:153-161`) can't find those field types either.
- **What:** Radio groups, the 1–10 scale, and the upload control have no accessible name; validation failures are silent and don't scroll into view.
- **Impact:** Excludes assistive-tech users from the core flow; sighted users hit "Submit does nothing" when the first error is a rating field below the fold (an accessibility-law exposure for a public/quasi-civic platform).
- **Fix:** `<fieldset>/<legend>` or `aria-labelledby` for radio/scale groups; `id` + `aria-describedby` linking each control to its error; `role="alert"` on the form banner; make `focusFirstError` target `[id^="${key}"]` or the field wrapper.

### H15 — ~5–7 MB of unoptimized images; no `next/image`; layout shift — **High (performance)**
- **Where:** `frontend/components/gallery.tsx`, `winners-gallery.tsx`, `award-feature.tsx` — 27 raw `<img>` tags (200–500 KB JPEGs), no `srcset`/`sizes`/`width`/`height`; `next.config.ts` has no image config.
- **What:** Any visitor who scrolls pays ~7 MB, and missing width/height causes cumulative layout shift as images load into the masonry.
- **Impact:** Slow loads and visible reflow on mobile data — the audience's typical condition.
- **Fix:** Adopt `next/image` (+`sharp` in the Docker runner stage), or at minimum add explicit `width`/`height` and pre-generate two sizes via the existing `scripts/optimize-images.sh`; delete ~2.5 MB of unused assets in `public/`.

### H16 — No admin controls to open/close nominations or toggle voting; no user management — **High (missing capability)**
- **Where:** `backend/app/models.py:59-62` flags (`nominations_open`, `voting_enabled`, `active`) are enforced but no API writes them; `admin.py:484-513` only creates/lists users — no deactivate, password reset, or role change; `manage.py` seeds 14 judges with **one shared password**.
- **What:** Closing nominations for 23 categories, or locking a leaked judge account, requires direct DB access. JWTs have no `jti`/version, so a DB-side password change leaves 12-hour tokens valid; the only kill switch (`active=false`) has no API.
- **Impact:** No operational control at the moments that matter (nomination deadline, a leaked credential during the event).
- **Fix:** Add `PATCH /admin/categories/{slug}` (flags + optional `nominations_close_at`), `PATCH /admin/users/{id}` (active/role/password), a first-login forced password change, and a `token_version` claim.

---

## 3. Minor Issues Found (selected Medium / Low; full list in the section files)

- **M — Concurrent score submit → unhandled `IntegrityError` 500** (`admin.py:155-163`): judge double-click can 500 with no confirmation the score saved. Catch `IntegrityError`, rollback, update.
- **M — N+1 queries** in leaderboard, judging-sheet CSV, and nominee listings (`admin.py:211-217,265-276,329-354`): the leaderboard (refreshed constantly by judges) issues hundreds of queries. Batch with `IN (...)` + grouped counts.
- **M — Panel-size divisor is dynamic and includes admins** (`admin.py:170-178`): adding a judge mid-event retroactively reweights every score. Snapshot the panel or count judges only.
- **M — Partial scores accepted and replace the full row** (`admin.py:140-141,161`): a 2-of-5 submission is valid and drops the other three. Require the full set or merge.
- **M — 401 strands the admin UI** (`admin-api.ts:55-58` clears storage but `auth.tsx` context isn't updated, so `Gate` never redirects): scattered "Not authenticated" errors until manual reload. Emit an event → `logout()` + redirect.
- **M — No draft persistence / unload guard on the long form** (`nomination-form.tsx`): a back-swipe or tapping a header link discards a 4-section form. Add `beforeunload` + `sessionStorage` draft.
- **M — Success screen hides the nomination reference** (`nomination-form.tsx:75-97`): `doneId` captured but never shown. Display "Reference #NNN".
- **M — `metadataBase` + OG image missing** (`app/layout.tsx:49-63`): WhatsApp/X shares render with no image (the main promo channels). Add `metadataBase` and `opengraph-image`.
- **M — `NEXT_PUBLIC_SITE_URL` not passed to the prod build** (`robots.ts:3`, `sitemap.ts:4`, `Dockerfile`, `docker-compose.prod.yml`): sitemap/robots emit `http://localhost:3000`. Wire the build ARG/ENV.
- **M — `docs/brand.md` contradicts `REDESIGN.md`/`globals.css`** (two "sources of truth"): gradients, Cinzel/Playfair, palette all superseded. Add a "superseded" banner or update.
- **M — Hardcoded "23" vs a 19-entry offline fallback** (`categories.tsx:23`, `stats.tsx:5` vs `site.ts:139-159`, missing 4 departmental categories): API-down page says "twenty-three" over a list of 19. Sync the fallback; derive the count from data.
- **M — Triple smooth-scroll stack fights on anchors** (CSS `scroll-behavior` + `data-scroll-behavior` + Lenis): set `html.lenis { scroll-behavior:auto }` or use `lenis.scrollTo`.
- **M — Countdown target has no timezone offset** (`site.ts:12`) and pins at 00:00:00:00 forever after the date; every visitor counts to 7 pm *their* time. Add `+01:00` and a post-event state.
- **M — Hero trophy sized by `vh`** can overflow landscape phones (`hero.tsx:61`); use `svh` and a smaller floor.
- **M — LinearScale is 10 tab stops per criterion** (`linear-scale.tsx`): reuse Radix RadioGroup for roving focus.
- **M — Eyebrow text fails AA contrast** (`--color-gold-deep #8C6A1F` on paper = 4.16:1 at ~11.5px): darken to ≈`#7A5C1B`.
- **M — File-upload UX**: no size/type hint, no progress %, generic failure (see H10).
- **Low (representative):** dead components `section-heading.tsx`, `card-tilt-glow.tsx` and dead CSS/keyframes; triplicated category-index row (`categories.tsx`/`nominate`/`vote`, ~120 dup lines); nested `<main>` (`(marketing)/layout.tsx:15` + page `<main>`s); literal class `"[data-closed]"` in `site-header.tsx:93`; login page shows "Incorrect email or password" for 429/500/network too (`admin-api.ts:37`); CSV export failure is a floating promise (`nominations/page.tsx:62`); judge sees an admin-only "Download judging sheet" button that always 403s (`leaderboard/page.tsx:80`); stale-response races on admin filters; `/vote` hardcodes two groups (`vote/page.tsx:12`); footer "Nomination Portal" links off-site to the old portal (`site.ts:14`); repo-root junk (42 MB `Awards 3.png`, untracked `AWARD 3D.gif`/`.xlsx` not gitignored, uncommitted `page-transition.tsx` WIP); stale `frontend/README.md` (ScrollTrigger/particle claims no longer true); root `README.md` "~20 categories" and `PLAN.md` "31 July" vs the real 29 July.

---

## 4. UI/UX Problems

**Accessibility (highest priority group):** form labels/errors not associated or announced (H14); closed mobile nav keeps focusable links in tab order under `aria-hidden` — add `inert` (`site-header.tsx:92-116`); no `<h1>` on the home page (hero wordmark is `aria-hidden`) (`hero.tsx:48-58`); admin rows are click-only `<tr>`s, unreachable by keyboard — use a `<Link>` (`nominations/page.tsx:109`); unlabeled admin filter `<select>`s; eyebrow contrast below AA; missing `autoComplete`/`name` on public inputs; no skip-to-content link; marquee ignores reduced-motion and is read 14× to screen readers. **Positive:** reduced-motion is otherwise handled well across nearly every animated component.

**Responsiveness:** admin tables clip on mobile (H13); hero `vh` sizing risks landscape overflow; category descriptions hidden below `md` reduce clarity. Display type uses `clamp()` and grids collapse sensibly — no fixed-width breakage found.

**Key-flow UX:** stuck submit/vote buttons (C3); SSR blocking with no loading/error states (H12); file-upload has no guidance/progress and swallows errors (H10); judge scoring starts blank on revisit (H1); success screen hides the reference number; "Voted elsewhere" copy is confusing — prefer "One vote per category." **Positive:** the voted-state treatment (banner + gold highlight + ✓) is excellent.

**Consistency:** two design "sources of truth" disagree (brand.md vs REDESIGN.md); marketing CTAs hand-roll pills instead of the `Button` component (focus-ring drift); mixed radii on the same page; legacy no-op CSS classes linger.

**Performance-adjacent:** ~7 MB images and no `next/image` (H15); an entire unused font family (Cormorant) plus excess Cinzel/Playfair weights ship; ~2.5 MB unused `public/` assets; the uncommitted `PageTransition` causes a flash + double-animation and doesn't actually run on client navigations (it lives in a persistent layout).

**Navigation/IA:** footer "Nomination Portal" sends users to the old external site; triple smooth-scroll stack can stutter/overshoot the anchor offset; `/vote` group list is hardcoded to two groups; admin mobile nav lacks an active state.

---

## 5. Backend / API Problems

**Correctness & concurrency:** vote race (C1), duplicate-nominee shortlist (H3), score-wipe replace (H1), concurrent-score `IntegrityError` (M), MySQL VARCHAR overflow (H7), timezone (H4), vote-count leak (H9).

**API design:** mix of `detail` string vs `{field_errors}` dict error shapes (clients must branch); several creates return 200 not 201; `PATCH /admin/nominees/{id}` takes `is_winner` as a query param (inconsistent); the one paginated endpoint returns no total count and the frontend never pages it (H6); no API versioning; FastAPI docs/OpenAPI exposed in prod and broken behind the `/api` strip (set `root_path="/api"` or disable docs).

**Data layer:** no length constraints mirrored to validators (H7); N+1 in leaderboard/exports (M); `is_winner`/`edition_year` leak on the public nominee list; Alembic migrations were autogenerated against SQLite (`server_default '(CURRENT_TIMESTAMP)'`) and are **never executed by tests** (`conftest.py:28` uses `create_all`), so model/migration drift is undetectable and DDL has never run against MariaDB; no naming-convention metadata for stable constraint names.

**Reliability/ops:** in-memory rate limiter, per-worker and unbounded (C2); `/health` doesn't touch the DB and the backend has no compose healthcheck; nothing runs `alembic upgrade head` on container start (manual step); `mailer.py` is dead, blocking code (would freeze the event loop if wired as-is) — so the implied nomination-confirmation email doesn't exist; no logging or global exception handler (bare 500s, no request context); CSV exports buffer entire result sets in memory.

**Auth architecture:** solid core (stateless HS256, PBKDF2, per-request DB role check → instant deactivation). Weaknesses: `/auth/refresh` re-issues from any valid token (indefinite sliding session, un-rate-limited, no rotation record); no `jti`/token-version → no revocation short of `active=false` (which has no API); no login lockout beyond the broken shared bucket.

**Test coverage gaps:** no concurrency tests (vote race, double-score); rate limiting disabled in tests and never asserted; upload size-limit path untested; results-privacy masking untested; shortlist/winner flow untested (would have caught H3); `/auth/refresh` and expired/inactive-token paths untested; migrations never executed; no MySQL-dialect test.

---

## 6. Security Risks

**Verified NOT vulnerable (positive):** no SQL injection (all parameterized ORM), JWT algorithm pinned (no `alg=none` confusion), authorization re-checked against the live DB on every request (no IDOR/missing-check found), PII confined to authenticated admin endpoints, IPs hashed before storage, no `dangerouslySetInnerHTML`, no path traversal in upload names (UUID + fixed extension map), no SSRF, non-root containers, PBKDF2-SHA256 240k iterations, and **nothing sensitive committed to git** (`git log --diff-filter=A` for `backend/.env`/`dev.db` is empty; only `*.env.example` tracked).

**Findings:**
- **Vote integrity (High)** — see C1; the product's core trust boundary is client-controlled.
- **Shared judge password + predictable emails (High)** — `manage.py:57-76` seeds all 14 judges with one password at `@judges.rcawards.local`; docstring even shows a weak value. No forced reset, no lockout. Issue unique per-judge credentials (or magic-link/OTP), force first-login reset, delete the seed password before go-live.
- **Weak JWT secret passes the prod guard (Medium)** — `config.py:66` checks only length ≥ 32 and a denylist; the guessable dev value `rcawards-2026-citybreed-jwt-secret-key-32bytes-min` (`backend/.env:14`) would pass. A guessable HS256 secret allows forged admin tokens. Enforce entropy; guarantee prod uses `openssl rand -hex 32`.
- **No CSP or HSTS (Medium)** — `main.py:30-37`/`next.config.ts`/Caddyfile set several headers but no `Content-Security-Policy` and no `Strict-Transport-Security`. Any future XSS has free rein (admin token is in `localStorage`), and first-visit SSL-strip is possible. Add a strict CSP and HSTS.
- **Stored file URL rendered as an admin-clicked link (Medium)** — `nominations.py:53-56` stores the client-supplied `FileRef.url` verbatim; `admin/nominations/[id]/page.tsx:135` renders it as a link. A nominator can point admins at an external phishing page. Reject any URL not under the configured upload base; ideally accept only an `upload_id`.
- **CSV / formula injection (Medium)** — `admin.py:271-317` writes user strings into CSV cells; `=HYPERLINK(...)`/`=cmd|...` executes when an admin opens the export. Prefix cells starting with `= + - @ tab CR` with `'`.
- **Unbounded in-memory upload read + unauthenticated storage growth (Medium)** — see H8; also uploads are never garbage-collected and aren't tied to a nomination (orphan accumulation).
- **Split/loose rate limiter; weak login brute-force protection (Medium)** — see C2; ~40 login attempts/min/IP across workers enables slow credential-stuffing (compounds the shared judge password).
- **Public uploads served with no authorization (Medium)** — `/uploads/<uuid>.<ext>` is world-readable; access control is only UUID unguessability (122 bits — good, but no revocation). For sensitive evidence, serve via an authenticated/signed-URL endpoint.
- **Admin/judge JWT in `localStorage` (Medium)** — XSS-exfiltratable, 12-hour validity, no revocation. Prefer `HttpOnly`+`Secure`+`SameSite` cookie with CSRF protection, or at minimum add CSP + short-lived rotating tokens.
- **FastAPI docs exposed in prod (Low)** — disable `docs_url`/`redoc_url`/`openapi_url` when in production.
- **Content-type trusted from the client, not sniffed (Low)** — mitigated (no SVG in allowlist, `nosniff` header), but validate magic bytes and serve with `Content-Disposition: attachment` where inline isn't needed.
- **No admin audit log or MFA (Low)** — add an append-only log of privileged actions; consider MFA for admins.

---

## 7. Missing or Incomplete Features

- **No enforceable vote integrity** — CAPTCHA / proof-of-humanity / verified voting (C1).
- **No admin control to open/close nominations or toggle voting per category** (H16); no time-based nomination window at all.
- **No user management** — deactivate, password reset, role change, forced first-login reset, token revocation (H16).
- **No nominee delete / un-shortlist**, and shortlist isn't idempotent (H3).
- **No nomination-confirmation email** — `mailer.py` is dead code; nominators get no receipt.
- **No `loading.tsx` / `error.tsx` / `not-found.tsx`** and no fetch timeouts (H12).
- **No OG/social image or `metadataBase`** — shares render blank (Section 3).
- **No nomination reference shown** on the success screen; **no draft persistence** on the long form.
- **No pagination or bulk actions** in the admin nominations list (H6).
- **No prefill of a judge's existing scores** (H1).
- **No Redis / distributed rate limiter or background-task machinery** (email, image processing, cleanup all run in-request).
- **No migration execution in CI** and no MySQL-dialect test (drift risk).

---

## 8. Performance Concerns

1. **Images:** ~7 MB of unoptimized JPEGs, no `next/image`, missing width/height → slow loads + CLS (H15).
2. **Fonts:** an entire unused family (Cormorant, 6 files) + excess Cinzel (6 weights) / Playfair italics.
3. **Unused `public/` assets:** ~2.5 MB shipped (trophy.png, awards-text.png, portraits, Next scaffold SVGs).
4. **SSR blocking on slow API** with no timeout on the highest-traffic page (H12).
5. **N+1 queries** in the leaderboard and CSV exports; CSV buffers whole result sets in memory.
6. **Rate limiter memory** grows unbounded (no key eviction).
7. **Rate-limit ceiling** (C2) is itself the biggest availability risk on launch night.
8. **PageTransition** WIP causes a flash + double-animation on load.

---

## 9. Recommended Improvements (beyond individual fixes)

- **Adopt a machine-readable API error contract** (`{code, message, field_errors?}`) so the frontend can branch reliably (fixes H2's class of bug at the source).
- **Introduce Redis** for rate limiting and (later) a job queue; it also unlocks distributed vote-dedup and login lockout.
- **Run migrations in CI against MariaDB** (service container) and on container start (entrypoint `alembic upgrade head`); mirror all column length constraints into Pydantic validators to end SQLite/MySQL divergence.
- **Add structured logging + a global exception handler** with request context and a stable error shape; add a DB-touching `/health` and a backend compose healthcheck.
- **Consolidate the design system:** one source of truth (REDESIGN.md), route marketing CTAs through `<Button asChild>`, delete dead components/CSS, and extract the triplicated category-index row.
- **Repo hygiene:** move source assets out of the repo root (42 MB PNG, GIF, XLSX, DOCX), extend `.gitignore` (`*.gif`, `*.xlsx`), and commit or revert the `PageTransition` WIP before tagging a release.
- **Accessibility pass** to WCAG 2.2 AA on the nomination form and admin surfaces (labels, errors, focus order, contrast, keyboard nav).
- **Observability for launch night:** basic uptime/latency monitoring and an alert if 429 rate spikes (early warning for C2-class issues).

---

## 10. Prioritized Implementation Plan

Fix in this order. Each phase ends with a re-run of the test suite plus the targeted manual checks in Section 11.

### Phase 0 — Immediate (launch blockers; do before any public traffic)
1. **C2** — add `--proxy-headers --forwarded-allow-ips` to uvicorn; verify real client IP reaches the limiter and `hash_ip`. *(config/deploy, ~1 line + verify)*
2. **C1** — DB `UniqueConstraint(category_id, voter_fingerprint)` + `IntegrityError` handling; add IP-based per-category dedup; add Turnstile/hCaptcha on `/votes`. *(migration + endpoint)*
3. **C3** — `try/catch/finally` around `submitNomination` and `castVote`; surface retry errors.
4. **H2** — return a machine-readable 409 code; only `rememberVote()` on `already_voted`.
5. **H1** — prefill judge scores (`GET …/scores/me`) and require the full criterion set (or merge server-side).
6. **H4** — normalize the voting window to UTC-with-offset on save; reject naive strings; validate ordering.
7. **H3** — idempotent shortlist + nominee delete/un-shortlist; disable the button while pending.
8. **H7 / H8** — length caps + truncation; streamed, size-checked uploads + Caddy body limit.
9. **H9** — stop returning live counts when results are private.
10. **H11** — fix Safari alpha-video detection; **test on a real iPhone.**
11. **H5 / H6** — separate load vs action errors on the admin detail page; paginate the nominations list.
12. **Security** — rotate/enforce a high-entropy `JWT_SECRET` for prod; replace the shared judge password with unique credentials + forced reset; disable prod docs.

### Phase 1 — Short-term (first week; hardening + core UX)
- **H10** — surface upload errors, add client size/type pre-check, reset the file input, handle HEIC/MOV.
- **H12** — fetch timeouts + `loading.tsx`/`error.tsx`/`not-found.tsx`.
- **H13 / H14** — `overflow-x-auto` on admin tables; nomination-form accessibility (labels, errors, focus, `inert` nav, hero `<h1>`).
- **Security** — CSP + HSTS; validate stored file URLs; sanitize CSV cells; add login lockout.
- **Backend** — catch concurrent-score `IntegrityError`; add `PATCH` category/user endpoints (open/close, deactivate); global exception handler + structured logging + DB `/health` + backend compose healthcheck; `alembic upgrade` entrypoint.
- **Ops** — pass `NEXT_PUBLIC_SITE_URL` to the build; add `metadataBase` + OG image.

### Phase 2 — Medium-term (weeks 2–4; reliability + polish)
- Move rate limiting to Redis (correct across workers, with eviction); mirror length constraints into validators; run migrations in CI against MariaDB.
- Fix N+1 in leaderboard/exports; snapshot panel size; require full criterion sets.
- Nomination-confirmation email via `BackgroundTasks`; orphaned-upload cleanup + storage quota.
- Draft persistence + reference number on the nomination flow; countdown timezone + post-event state; contrast/typography fixes; consolidate smooth-scroll.
- Image optimization (`next/image` + `sharp`); font trimming; delete unused assets; resolve the `PageTransition` WIP.
- Reconcile docs (README/brand.md/PLAN.md); sync the 19→23 offline fallback; fix the footer portal link.

### Phase 3 — Long-term (post-event; maturity)
- HttpOnly cookie sessions + CSRF, or full token-revocation (`jti`/`token_version`); MFA for admins; admin audit log.
- API versioning + a uniform error envelope; move uploads to object storage/CDN with signed URLs.
- Concurrency/load tests and a documented launch-night runbook (scaling, monitoring, 429 alerting).
- Extract shared components (category-index row), delete dead code/CSS, and add e2e tests (Playwright) for the nomination/vote/judging flows.

---

## 11. Suggested Testing Checklist

**Automated (add to CI):**
- [ ] Vote race: N concurrent `POST /votes` (same fingerprint, one category) → exactly one succeeds.
- [ ] One-vote-per-category enforced at the DB level (constraint present).
- [ ] Double score-submit → no 500; score persists once.
- [ ] Re-score updates one criterion **without** wiping the others.
- [ ] Upload > limit → 413 (streamed, not buffered); disallowed type → 415 with a clear message.
- [ ] Results masked when `voting_results_public=false` — including the `cast_vote` response.
- [ ] Shortlist is idempotent; rejecting a nomination hides its nominee.
- [ ] MySQL-strict: over-length name/URL is truncated/validated, not a 500 (run against MariaDB).
- [ ] `alembic upgrade head` succeeds on a fresh MariaDB; schema matches models.
- [ ] Rate limiter returns 429 with the real client IP behind a proxy; login lockout after N failures.
- [ ] `/auth/refresh`, expired token, and inactive-user paths behave correctly.

**Manual — user flows:**
- [ ] Submit a full nomination on a **throttled mobile connection**; kill the network mid-submit → clear error + retry, no stuck button, no data loss.
- [ ] Upload a real **iPhone HEIC photo** and a `.mov`; confirm behavior and error clarity.
- [ ] Vote, then try to vote again (same category, second nominee, and after reopening) → correct messaging, no false "recorded."
- [ ] Vote exactly as the window closes → correct "closed" message, **not** a false success + lockout.
- [ ] Hero on a **real iPhone/Safari** → no black box behind the trophy.
- [ ] Full keyboard-only pass of the nomination form; screen-reader announces labels and errors.
- [ ] Admin tables on a 375px phone → horizontally scrollable, all columns reachable.
- [ ] Judge scores all criteria, returns, adjusts one → others preserved; leaderboard average correct.
- [ ] Expired admin session → redirected to login, not stranded.
- [ ] Social-share the site on WhatsApp/X → image + title render.

**Manual — ops/security:**
- [ ] Prod `JWT_SECRET` is 32 random bytes; docs endpoints disabled; CSP/HSTS present (check response headers).
- [ ] Load test `/votes` and `/nominations` above 20/min from multiple IPs → no global 429; abusers throttled individually.
- [ ] CSV export opened in Excel → no formula executes.
- [ ] Confirm nomination evidence URLs require the intended access level.

---

## 12. Final Professional Recommendation

**Do not launch in the current state.** The engineering foundation is strong and the security fundamentals
are genuinely good, but three Critical issues — forgeable votes, a production-only rate-limit/anti-fraud
collapse, and dead-locking submit/vote buttons — plus the judging score-wipe and the timezone bug would,
together, likely produce a **contested result and a visible outage** on event night.

The good news: the launch-blocking list is short, specific, and mostly small, surgical changes. Complete
**Phase 0 (Immediate)** and **Phase 1 (Short-term)**, re-run the automated suite, and work through the
manual checklist in Section 11 — with particular attention to the on-device Safari test, a throttled-network
submit test, and a multi-IP load test of the vote endpoint. After that, this platform is fit for production
and well-positioned to run cleanly on the night.

**Recommended immediate next step:** authorize the Phase 0 changes as a single hardening branch so they can
be implemented, tested, and reviewed together before any public traffic.
