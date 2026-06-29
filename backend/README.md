# RCAwards — Backend

FastAPI + SQLAlchemy + MySQL backend for the Redemption City Award of Excellence
2026 platform.

- **Phase 1** — the form-schema engine: every award category is a JSON form
  definition, validated by the same spec the frontend renders, seeded into the DB.
- **Phase 2** — the API: nomination submission (validated against the engine),
  file uploads, newsletter signup, JWT auth, and the admin/judging endpoints
  (review, status, scoring, leaderboard, CSV export, user management), with
  per-IP rate limiting on public writes.

## What's here

```
app/
  config.py            # settings (DATABASE_URL etc.)
  db.py                # engine, session, declarative Base
  models.py            # SQLAlchemy models (categories, nominations, votes, …)
  main.py              # FastAPI app: /health + read-only category endpoints
  schemas/
    form_schema.py     # the form-definition spec (Pydantic) — source of truth
    validation.py      # validates a submission against a category's schema
  seed/
    categories/*.json  # one JSON form definition per distinct category
    departments.json   # uniform Departmental Impact template + department list
    loader.py          # validates + loads all categories into the DB
alembic/               # migrations (initial schema covers all 9 tables)
tests/                 # validator + seed-integrity tests
```

## The form-schema engine

The 23 award categories have very different forms, so forms are **data, not code**.
A category is a `FormDefinition`: `sections[] → fields[]`, where each field has a
`type` (`short_text`, `paragraph`, `email`, `phone`, `multiple_choice`, `dropdown`,
`yes_no`, `linear_scale_1_10`, `file_upload`, `region_select`). The frontend renders
any form from this JSON; `validation.py` enforces the same rules server-side.

The **Departmental Impact** awards are generated from `seed/departments.json` so all
8 departments share one uniform form and the five fixed criteria (Leadership,
Integrity, Problem Solving, Collaboration & Team Spirit, Impact & Value) — per the
PFO directive in the source brief.

Categories: **8 city · 4 regional · 8 departmental · 3 SATGO = 23**.

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit DATABASE_URL for your MySQL
```

## Common tasks

```bash
# Validate all category seeds (no database needed)
python -m app.seed.loader --check

# Apply migrations to the database in DATABASE_URL
alembic upgrade head

# Seed/refresh categories (idempotent upsert)
python -m app.seed.loader

# Create the first admin (then create judges via the API or this command)
python -m app.manage create-admin --email you@example.com --password 'your-strong-pass'
python -m app.manage create-user --email judge@example.com --password 'pass1234' --role judge

# Run the test suite
pytest

# Run the API locally (interactive docs at http://localhost:8000/docs)
uvicorn app.main:app --reload
```

## Endpoints

### Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/categories` | List active categories (summary) |
| GET | `/categories/{slug}` | One category + its full form definition |
| POST | `/nominations` | Submit a nomination (validated against the category's form) |
| POST | `/uploads` | Upload a supporting file → returns a URL reference |
| POST | `/signup` | Newsletter "be first to know" signup |

### Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Email + password → JWT (OAuth2 password form) |
| POST | `/auth/refresh` | Exchange a valid token for a fresh one |
| GET | `/auth/me` | Current user |

### Admin / judging (Bearer token)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/admin/nominations` | admin, judge | List/filter nominations (`?category=&status=&limit=&offset=`) |
| GET | `/admin/nominations/{id}` | admin, judge | Full nomination incl. answers & files |
| PATCH | `/admin/nominations/{id}` | admin | Set status (submitted / shortlisted / rejected) |
| POST | `/admin/nominations/{id}/scores` | admin, judge | Submit/replace this judge's score |
| GET | `/admin/categories/{slug}/leaderboard` | admin, judge | Nominations ranked by average judge total |
| GET | `/admin/nominations/export/csv` | admin | CSV export (`?category=` optional) |
| POST | `/admin/users` | admin | Create an admin/judge account |
| GET | `/admin/users` | admin | List staff accounts |

Public write endpoints are rate-limited per IP (configurable). Passwords are
hashed with PBKDF2-HMAC-SHA256; auth is stateless JWT.

> **Note:** Public **voting** (Phase 5) is intentionally not built yet — the
> `nominees`/`votes` tables exist, but the endpoints arrive with the voting UI.
