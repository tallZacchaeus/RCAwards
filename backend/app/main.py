"""FastAPI entrypoint.

Phase 1 ships read-only endpoints that surface the form-schema engine so the
frontend can render any nomination form from the database. Write paths
(submitting nominations, uploads, auth, voting, judging) arrive in Phase 2.
"""
from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_session
from .models import Category

app = FastAPI(title=get_settings().app_name)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "edition_year": get_settings().edition_year}


@app.get("/categories")
def list_categories(session: Session = Depends(get_session)) -> list[dict]:
    """List active categories (summary only) for the marketing site & picker."""
    rows = session.scalars(
        select(Category).where(Category.active).order_by(Category.sort_order)
    ).all()
    return [
        {
            "slug": c.slug,
            "name": c.name,
            "group": c.group.value,
            "description": c.description,
            "voting_enabled": c.voting_enabled,
            "nominations_open": c.nominations_open,
        }
        for c in rows
    ]


@app.get("/categories/{slug}")
def get_category(slug: str, session: Session = Depends(get_session)) -> dict:
    """Return a single category's full form definition for rendering."""
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None or not category.active:
        raise HTTPException(status_code=404, detail="Category not found")
    return {
        "slug": category.slug,
        "name": category.name,
        "group": category.group.value,
        "description": category.description,
        "voting_enabled": category.voting_enabled,
        "nominations_open": category.nominations_open,
        "form": category.form_schema,
    }
