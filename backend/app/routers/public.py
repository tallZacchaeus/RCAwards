"""Public, unauthenticated read endpoints + newsletter signup."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Category, Subscriber
from ..ratelimit import rate_limit
from ..schemas.api import (
    CategoryDetail,
    CategorySummary,
    SignupRequest,
    SignupResult,
)

router = APIRouter(tags=["public"])


@router.get("/categories", response_model=list[CategorySummary])
def list_categories(session: Session = Depends(get_session)) -> list[Category]:
    return list(
        session.scalars(
            select(Category).where(Category.active).order_by(Category.sort_order)
        ).all()
    )


@router.get("/categories/{slug}", response_model=CategoryDetail)
def get_category(slug: str, session: Session = Depends(get_session)) -> CategoryDetail:
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None or not category.active:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryDetail(
        slug=category.slug,
        name=category.name,
        group=category.group.value,
        description=category.description,
        voting_enabled=category.voting_enabled,
        nominations_open=category.nominations_open,
        form=category.form_schema,
    )


@router.post("/signup", response_model=SignupResult, dependencies=[Depends(rate_limit)])
def signup(payload: SignupRequest, session: Session = Depends(get_session)) -> SignupResult:
    email = payload.email.lower()
    exists = session.scalar(select(Subscriber).where(Subscriber.email == email))
    if exists:
        return SignupResult(email=email, subscribed=True)
    session.add(Subscriber(email=email))
    try:
        session.commit()
    except IntegrityError:  # race: another request inserted the same email
        session.rollback()
    return SignupResult(email=email, subscribed=True)
