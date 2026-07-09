# Redemption City Award of Excellence 2026

Web platform for the **Redemption City Award of Excellence**, 4th Edition —
_powered by City Breed_. Event: **Tuesday, 28 July 2026**.

The platform has three faces: a marketing site, native nomination forms for 20
award categories, and public voting plus an admin/judging dashboard. See
[`PLAN.md`](PLAN.md) for the full build plan and architecture.

## Stack

- **Frontend** — Next.js (TypeScript) + Tailwind + shadcn/ui + GSAP/Lenis _(Phase 3)_
- **Backend** — Python + FastAPI + SQLAlchemy
- **Database** — MySQL 8

## Repo layout

```
backend/    FastAPI + SQLAlchemy + Alembic (Phase 1 — see backend/README.md)
docs/       source briefs and notes
frontend/   Next.js app (added in Phase 0/3)
PLAN.md     full plan, phases, and design/motion system
```

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Form-schema engine, category seeds, DB models, migrations, validator | ✅ Done |
| 2 | Backend API: submissions, uploads, signup, auth, judging, scoring, exports | ✅ Done |
| 3 | Marketing site (merged design + GSAP motion) | ✅ Done |
| 4 | Nomination forms (dynamic renderer) | ✅ Done |
| 5 | Public voting | ✅ Done |
| 6 | Admin / judging dashboard | ✅ Done |
| 7 | Hardening & launch (code complete; deploy → [DEPLOY.md](DEPLOY.md)) | ✅ Done |

## Quick start (backend)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed.loader --check   # validates the 20 category definitions
```

See [`backend/README.md`](backend/README.md) for migrations, seeding, and running the API.
