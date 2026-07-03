"""Admin & judge endpoints: review, status, scoring, leaderboard, export, users."""
from __future__ import annotations

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import (
    Category,
    Nomination,
    NominationStatus,
    Nominee,
    Score,
    Setting,
    User,
    UserRole,
    Vote,
)
from ..judging import judging_criteria, score_nominee
from ..schemas.api import (
    CriterionAverage,
    CriterionOut,
    FileRef,
    LeaderboardEntry,
    NominationDetail,
    NominationListItem,
    NomineeCreate,
    NomineeOut,
    ScoreCreate,
    ScoreOut,
    SettingsOut,
    SettingsUpdate,
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
    nomination = _get_nomination(session, nomination_id)
    if not payload.criteria:
        raise HTTPException(status_code=422, detail="At least one criterion score is required")

    # Scores may only target the category's official judging criteria.
    category = session.get(Category, nomination.category_id)
    valid_keys = {c.key for c in judging_criteria(category.form_schema)} if category else set()
    for key, value in payload.criteria.items():
        if key not in valid_keys:
            raise HTTPException(
                status_code=422, detail=f"'{key}' is not a judging criterion of this category"
            )
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


def _panel_size(session: Session) -> int:
    return int(
        session.scalar(
            select(func.count(User.id)).where(
                User.active, User.role.in_([UserRole.judge, UserRole.admin])
            )
        )
        or 0
    )


def _category_or_404(session: Session, slug: str) -> Category:
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/categories/{slug}/criteria", response_model=list[CriterionOut])
def category_criteria(
    slug: str,
    session: Session = Depends(get_session),
    _: User = Depends(require_staff),
) -> list[CriterionOut]:
    """The official judging criteria for a category (its 1-10 form fields)."""
    category = _category_or_404(session, slug)
    return [CriterionOut(key=c.key, label=c.label) for c in judging_criteria(category.form_schema)]


@router.get("/categories/{slug}/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(
    slug: str,
    session: Session = Depends(get_session),
    _: User = Depends(require_staff),
) -> list[LeaderboardEntry]:
    """Rank a category's nominations by Ranked Score, with per-criterion averages."""
    category = _category_or_404(session, slug)
    criteria = judging_criteria(category.form_schema)
    labels = {c.key: c.label for c in criteria}
    panel = _panel_size(session)

    nominations = list(
        session.scalars(select(Nomination).where(Nomination.category_id == category.id)).all()
    )
    entries: list[LeaderboardEntry] = []
    for nom in nominations:
        scores = session.scalars(select(Score).where(Score.nomination_id == nom.id)).all()
        result = score_nominee([s.criteria for s in scores], panel)
        entries.append(
            LeaderboardEntry(
                nomination_id=nom.id,
                nominee=summarize_submission(nom.answers)["nominee_name"],
                ranked_score=result.ranked_score,
                criteria=[
                    CriterionAverage(
                        key=c.key,
                        label=c.label,
                        average=result.criteria_averages.get(c.key, 0.0),
                    )
                    for c in criteria
                ]
                or [
                    CriterionAverage(key=k, label=labels.get(k, k), average=v)
                    for k, v in result.criteria_averages.items()
                ],
                judge_count=result.judge_count,
                panel_size=panel,
                status=nom.status.value,
            )
        )
    entries.sort(key=lambda e: e.ranked_score, reverse=True)
    return entries


@router.get("/categories/{slug}/judging-sheet.csv")
def judging_sheet_csv(
    slug: str,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> StreamingResponse:
    """Reproduce the committee's judging workbook for a category from live scores:
    a nominee × criterion matrix with one column per judge, plus average + ranked score."""
    category = _category_or_404(session, slug)
    criteria = judging_criteria(category.form_schema)
    panel = _panel_size(session)

    judges = list(
        session.scalars(
            select(User)
            .where(User.active, User.role.in_([UserRole.judge, UserRole.admin]))
            .order_by(User.id)
        ).all()
    )
    judge_label = {j.id: (j.name or j.email) for j in judges}

    nominations = list(
        session.scalars(select(Nomination).where(Nomination.category_id == category.id)).all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["NOMINEE", "CRITERIA", *[judge_label[j.id] for j in judges], "Average", "Ranked Score"])

    for nom in nominations:
        scores = session.scalars(select(Score).where(Score.nomination_id == nom.id)).all()
        by_judge = {s.judge_id: s.criteria for s in scores}
        result = score_nominee([s.criteria for s in scores], panel)
        nominee = summarize_submission(nom.answers)["nominee_name"] or f"Nomination #{nom.id}"
        writer.writerow([nominee, "", *["" for _ in judges], "", result.ranked_score])
        for c in criteria:
            row_scores = [by_judge.get(j.id, {}).get(c.key, "") for j in judges]
            writer.writerow(["", c.label, *row_scores, result.criteria_averages.get(c.key, ""), ""])

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=judging-sheet-{slug}.csv"},
    )


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


# --- Nominees / voting slate (admin only) -------------------------------------

def _nominee_out(session: Session, nominee: Nominee, slug: str) -> NomineeOut:
    count = session.scalar(
        select(func.count(Vote.id)).where(Vote.nominee_id == nominee.id)
    )
    return NomineeOut(
        id=nominee.id,
        category_slug=slug,
        display_name=nominee.display_name,
        summary=nominee.summary,
        photo_url=nominee.photo_url,
        vote_count=int(count or 0),
        is_winner=nominee.is_winner,
    )


@router.get("/nominees", response_model=list[NomineeOut])
def list_nominees(
    category: str | None = Query(None),
    session: Session = Depends(get_session),
    _: User = Depends(require_staff),
) -> list[NomineeOut]:
    stmt = select(Nominee, Category.slug).join(Category, Nominee.category_id == Category.id)
    if category:
        stmt = stmt.where(Category.slug == category)
    stmt = stmt.order_by(Nominee.display_name)
    return [_nominee_out(session, n, slug) for n, slug in session.execute(stmt).all()]


@router.post("/nominees", response_model=NomineeOut, status_code=status.HTTP_201_CREATED)
def create_nominee(
    payload: NomineeCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> NomineeOut:
    category = session.scalar(select(Category).where(Category.slug == payload.category_slug))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    nominee = Nominee(
        category_id=category.id,
        display_name=payload.display_name,
        summary=payload.summary,
        photo_url=payload.photo_url,
        source_nomination_id=payload.source_nomination_id,
        edition_year=category.edition_year,
        is_shortlisted=True,
    )
    session.add(nominee)
    session.commit()
    session.refresh(nominee)
    return _nominee_out(session, nominee, category.slug)


@router.post("/nominations/{nomination_id}/shortlist", response_model=NomineeOut, status_code=status.HTTP_201_CREATED)
def shortlist_nomination(
    nomination_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> NomineeOut:
    """Promote a nomination to a shortlisted nominee (eligible for voting)."""
    nomination = _get_nomination(session, nomination_id)
    nomination.status = NominationStatus.shortlisted
    display_name = summarize_submission(nomination.answers)["nominee_name"] or f"Nominee #{nomination.id}"
    nominee = Nominee(
        category_id=nomination.category_id,
        source_nomination_id=nomination.id,
        display_name=display_name,
        edition_year=nomination.category.edition_year,
        is_shortlisted=True,
    )
    session.add(nominee)
    session.commit()
    session.refresh(nominee)
    return _nominee_out(session, nominee, nomination.category.slug)


@router.patch("/nominees/{nominee_id}", response_model=NomineeOut)
def update_nominee(
    nominee_id: int,
    is_winner: bool = Query(...),
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> NomineeOut:
    nominee = session.get(Nominee, nominee_id)
    if nominee is None:
        raise HTTPException(status_code=404, detail="Nominee not found")
    nominee.is_winner = is_winner
    session.commit()
    return _nominee_out(session, nominee, nominee.category.slug)


# --- Settings: voting window & results visibility (admin only) ----------------

def _read_setting(session: Session, key: str) -> str | None:
    row = session.get(Setting, key)
    return row.value if row else None


def _write_setting(session: Session, key: str, value: str | None) -> None:
    row = session.get(Setting, key)
    if value in (None, ""):
        if row:
            session.delete(row)
    elif row:
        row.value = value
    else:
        session.add(Setting(key=key, value=value))


def _current_settings(session: Session) -> SettingsOut:
    results = _read_setting(session, "voting_results_public")
    return SettingsOut(
        voting_opens_at=_read_setting(session, "voting_opens_at"),
        voting_closes_at=_read_setting(session, "voting_closes_at"),
        voting_results_public=results is None or results.lower() == "true",
    )


def _validate_iso(value: str, field: str) -> None:
    if value == "":
        return
    try:
        datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"{field} must be an ISO-8601 datetime")


@router.get("/settings", response_model=SettingsOut)
def get_settings(
    session: Session = Depends(get_session), _: User = Depends(require_admin)
) -> SettingsOut:
    return _current_settings(session)


@router.put("/settings", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> SettingsOut:
    if payload.voting_opens_at is not None:
        _validate_iso(payload.voting_opens_at, "voting_opens_at")
        _write_setting(session, "voting_opens_at", payload.voting_opens_at)
    if payload.voting_closes_at is not None:
        _validate_iso(payload.voting_closes_at, "voting_closes_at")
        _write_setting(session, "voting_closes_at", payload.voting_closes_at)
    if payload.voting_results_public is not None:
        _write_setting(
            session, "voting_results_public", "true" if payload.voting_results_public else "false"
        )
    session.commit()
    return _current_settings(session)


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
    user = User(
        email=payload.email.lower(),
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=role,
    )
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
