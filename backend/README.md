# RCAwards — Backend (Phase 1)

FastAPI + SQLAlchemy + MySQL backend for the Redemption City Award of Excellence
2026 platform. **Phase 1** delivers the form-schema engine: every award category
is described by a JSON form definition, validated by the same spec the frontend
renders, and seeded into the database.

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

# Run the test suite
pytest

# Run the API locally
uvicorn app.main:app --reload
```

## Endpoints (Phase 1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/categories` | List active categories (summary) |
| GET | `/categories/{slug}` | One category + its full form definition |

Write paths (nomination submission, file uploads, auth, voting, judging) land in
**Phase 2**.
