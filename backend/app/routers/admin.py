"""Admin & judge endpoints: review, status, scoring, leaderboard, export, users."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import (
    Category,
    Nomination,
    NominationStatus,
    Score,
    User,
    UserRole,
)
from ..schemas.api import (
    FileRef,
    LeaderboardEntry,
    NominationDetail,
    NominationListItem,
    ScoreCreate,
    ScoreOut,
    StatusUpdate,
    UserCreate,
    UserOut,
)
from ..security import hash_password, require_admin, require_staff
from ._helpers import summarize_submission

router = APIRouter(prefix="/admin", tags=["admin"])


def _get_nomination(session: Session, nomination_id: int) -> Nomination:
    nomination = session.get(Nomination, nomination_id)
    if nomination is None:
        raise HTTPException(status_code=404, detail="Nomination not found")
    return nomination


# --- Review (admin + judge) ---------------------------------------------------

@router.get("/nominations", response_model=list[NominationListItem])
def list_nominations(
    category: str | None = Query(None, description="Filter by category slug"),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    _: User = Depends(require_staff),
) -> list[NominationListItem]:
    stmt = select(Nomination, Category.slug).join(Category, Nomination.category_id == Category.id)
    if category:
        stmt = stmt.where(Category.slug == category)
    if status_filter:
        stmt = stmt.where(Nomination.status == _parse_status(status_filter))
    stmt = stmt.order_by(Nomination.created_at.desc()).limit(limit).offset(offset)

    return [
        NominationListItem(
            id=nom.id,
            category_slug=slug,
            nominator_name=nom.nominator_name,
            nominator_contact=nom.nominator_contact,
            status=nom.status.value,
            created_at=nom.created_at,
        )
        for nom, slug in session.execute(stmt).all()
    ]


@router.get("/nominations/{nomination_id}", response_model=NominationDetail)
def get_nomination(
    nomination_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_staff),
) -> NominationDetail:
    nomination = _get_nomination(session, nomination_id)
    return NominationDetail(
        id=nomination.id,
        category_slug=nomination.category.slug,
        nominator_name=nomination.nominator_name,
        nominator_contact=nomination.nominator_contact,
        residency=nomination.residency,
        status=nomination.status.value,
        created_at=nomination.created_at,
        answers=nomination.answers,
        files=[FileRef(field_key=f.field_key, url=f.url, kind=f.kind) for f in nomination.files],
    )


# --- Status (admin only) ------------------------------------------------------

@router.patch("/nominations/{nomination_id}", response_model=NominationListItem)
def update_status(
    nomination_id: int,
    payload: StatusUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> NominationListItem:
    nomination = _get_nomination(session, nomination_id)
    nomination.status = _parse_status(payload.status)
    session.commit()
    session.refresh(nomination)
    return NominationListItem(
        id=nomination.id,
        category_slug=nomination.category.slug,
        nominator_name=nomination.nominator_name,
        nominator_contact=nomination.nominator_contact,
        status=nomination.status.value,
        created_at=nomination.created_at,
    )


# --- Scoring (judge or admin) -------------------------------------------------

@router.post("/nominations/{nomination_id}/scores", response_model=ScoreOut)
def submit_score(
    nomination_id: int,
    payload: ScoreCreate,
    session: Session = Depends(get_session),
    user: User = Depends(require_staff),
) -> ScoreOut:
    _get_nomination(session, nomination_id)
    if not payload.criteria:
        raise HTTPException(status_code=422, detail="At least one criterion score is required")
    for key, value in payload.criteria.items():
        if not 1 <= value <= 10:
            raise HTTPException(status_code=422, detail=f"Score for '{key}' must be 1-10")

    total = sum(payload.criteria.values())
    score = session.scalar(
        select(Score).where(Score.nomination_id == nomination_id, Score.judge_id == user.id)
    )
    if score is None:
        score = Score(nomination_id=nomination_id, judge_id=user.id)
        session.add(score)
    score.criteria = payload.criteria
    score.total = total
    session.commit()

    return ScoreOut(
        nomination_id=nomination_id, judge_id=user.id, criteria=payload.criteria, total=total
    )


@router.get("/categories/{slug}/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(
    slug: str,
    session: Session = Depends(get_session),
    _: User = Depends(require_staff),
) -> list[LeaderboardEntry]:
    """Rank a category's nominations by average judge total (to shortlist top 3)."""
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    stmt = (
        select(
            Nomination,
            func.avg(Score.total).label("avg_total"),
            func.count(Score.id).label("judge_count"),
        )
        .outerjoin(Score, Score.nomination_id == Nomination.id)
        .where(Nomination.category_id == category.id)
        .group_by(Nomination.id)
        .order_by(func.coalesce(func.avg(Score.total), 0).desc())
    )

    entries = []
    for nomination, avg_total, judge_count in session.execute(stmt).all():
        entries.append(
            LeaderboardEntry(
                nomination_id=nomination.id,
                nominee=summarize_submission(nomination.answers)["nominee_name"],
                average_total=round(float(avg_total), 2) if avg_total is not None else 0.0,
                judge_count=int(judge_count),
                status=nomination.status.value,
            )
        )
    return entries


# --- Export (admin only) ------------------------------------------------------

@router.get("/nominations/export/csv")
def export_csv(
    category: str | None = Query(None, description="Filter by category slug"),
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> StreamingResponse:
    stmt = select(Nomination, Category.slug).join(Category, Nomination.category_id == Category.id)
    if category:
        stmt = stmt.where(Category.slug == category)
    stmt = stmt.order_by(Nomination.created_at.desc())
    rows = session.execute(stmt).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["id", "category", "status", "nominator_name", "nominator_contact",
         "residency", "nominee", "created_at", "answers_json"]
    )
    for nom, slug in rows:
        summary = summarize_submission(nom.answers)
        writer.writerow([
            nom.id, slug, nom.status.value, nom.nominator_name, nom.nominator_contact,
            nom.residency, summary["nominee_name"], nom.created_at.isoformat(),
            _json_compact(nom.answers),
        ])
    buffer.seek(0)
    filename = f"nominations-{category or 'all'}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# --- Users (admin only) -------------------------------------------------------

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> User:
    if session.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    try:
        role = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=422, detail="role must be 'admin' or 'judge'")
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password), role=role)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[User]:
    return list(session.scalars(select(User).order_by(User.id)).all())


# --- helpers ------------------------------------------------------------------

def _parse_status(value: str) -> NominationStatus:
    try:
        return NominationStatus(value)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="status must be one of: submitted, shortlisted, rejected",
        )


def _json_compact(data: dict) -> str:
    import json

    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))
