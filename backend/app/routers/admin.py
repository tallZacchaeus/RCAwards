"""Admin & judge endpoints: review, status, scoring, leaderboard, export, users."""
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
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
from ..analytics import compute_nomination_analytics
from ..exports import build_nominations_pdf, build_nominations_xlsx
from ..judging import judging_criteria, score_nominee
from ..schemas.api import (
    CategoryFlags,
    CategoryFlagsUpdate,
    CriterionAverage,
    CriterionOut,
    FileRef,
    LeaderboardEntry,
    NominationAnalytics,
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
    UserUpdate,
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
    new_status = _parse_status(payload.status)
    nomination.status = new_status
    # Keep the public voting slate in sync: rejecting a nomination hides any
    # nominee that was promoted from it, so it disappears from the vote page.
    if new_status == NominationStatus.rejected:
        for nominee in session.scalars(
            select(Nominee).where(Nominee.source_nomination_id == nomination.id)
        ).all():
            nominee.is_shortlisted = False
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

    score = session.scalar(
        select(Score).where(Score.nomination_id == nomination_id, Score.judge_id == user.id)
    )
    if score is None:
        score = Score(nomination_id=nomination_id, judge_id=user.id)
        session.add(score)
    # Merge into any existing criteria rather than replacing the whole map, so a
    # judge who resubmits a subset of criteria doesn't silently wipe the rest.
    merged = {**(score.criteria or {}), **payload.criteria}
    total = sum(merged.values())
    score.criteria = merged
    score.total = total
    try:
        session.commit()
    except IntegrityError:
        # Concurrent first-time submit by the same judge lost the race on
        # uq_score_once — reload the winner's row and merge into it.
        session.rollback()
        score = session.scalar(
            select(Score).where(Score.nomination_id == nomination_id, Score.judge_id == user.id)
        )
        merged = {**(score.criteria or {}), **payload.criteria}
        total = sum(merged.values())
        score.criteria = merged
        score.total = total
        session.commit()

    return ScoreOut(
        nomination_id=nomination_id, judge_id=user.id, criteria=merged, total=total
    )


@router.get("/nominations/{nomination_id}/scores/me", response_model=ScoreOut | None)
def my_score(
    nomination_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_staff),
) -> ScoreOut | None:
    """The current judge's own saved score for a nomination, so the scoring UI can
    prefill instead of starting blank (which risks overwriting prior scores)."""
    _get_nomination(session, nomination_id)
    score = session.scalar(
        select(Score).where(Score.nomination_id == nomination_id, Score.judge_id == user.id)
    )
    if score is None:
        return None
    return ScoreOut(
        nomination_id=nomination_id,
        judge_id=user.id,
        criteria=score.criteria or {},
        total=score.total or 0,
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


def _scores_by_nomination(session: Session, nomination_ids: list[int]) -> dict[int, list[Score]]:
    """All scores for the given nominations in ONE query, grouped in Python —
    avoids a per-nomination SELECT (the leaderboard is refreshed constantly)."""
    grouped: dict[int, list[Score]] = {nid: [] for nid in nomination_ids}
    if not nomination_ids:
        return grouped
    for score in session.scalars(
        select(Score).where(Score.nomination_id.in_(nomination_ids))
    ).all():
        grouped.setdefault(score.nomination_id, []).append(score)
    return grouped


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
    scores_by_nom = _scores_by_nomination(session, [n.id for n in nominations])
    entries: list[LeaderboardEntry] = []
    for nom in nominations:
        scores = scores_by_nom.get(nom.id, [])
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
    scores_by_nom = _scores_by_nomination(session, [n.id for n in nominations])

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    _safe_writerow(writer, ["NOMINEE", "CRITERIA", *[judge_label[j.id] for j in judges], "Average", "Ranked Score"])

    for nom in nominations:
        scores = scores_by_nom.get(nom.id, [])
        by_judge = {s.judge_id: s.criteria for s in scores}
        result = score_nominee([s.criteria for s in scores], panel)
        nominee = summarize_submission(nom.answers)["nominee_name"] or f"Nomination #{nom.id}"
        _safe_writerow(writer, [nominee, "", *["" for _ in judges], "", result.ranked_score])
        for c in criteria:
            row_scores = [by_judge.get(j.id, {}).get(c.key, "") for j in judges]
            _safe_writerow(writer, ["", c.label, *row_scores, result.criteria_averages.get(c.key, ""), ""])

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
    _safe_writerow(
        writer,
        ["id", "category", "status", "nominator_name", "nominator_contact",
         "residency", "nominee", "created_at", "answers_json"],
    )
    for nom, slug in rows:
        summary = summarize_submission(nom.answers)
        _safe_writerow(writer, [
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


# --- Analytics + rich exports (admin only) ------------------------------------

_XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/analytics/nominations", response_model=NominationAnalytics)
def nomination_analytics(
    category: str | None = Query(None, description="Scope to one category slug"),
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> NominationAnalytics:
    """Aggregate nomination stats for the admin dashboard (all or one category)."""
    if category:
        _category_or_404(session, category)
    return NominationAnalytics(**compute_nomination_analytics(session, category))


@router.get("/nominations/export.xlsx")
def export_xlsx(
    category: str | None = Query(None, description="Filter by category slug"),
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Response:
    """Full responses as an Excel workbook: a Summary sheet + one sheet per category."""
    if category:
        _category_or_404(session, category)
    data = build_nominations_xlsx(session, category)
    filename = f"nominations-{category or 'all'}.xlsx"
    return Response(
        content=data,
        media_type=_XLSX_MEDIA,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reports/nominations.pdf")
def export_pdf(
    category: str | None = Query(None, description="Filter by category slug"),
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Response:
    """A branded PDF summary report of nominations (all or one category)."""
    if category:
        _category_or_404(session, category)
    data = build_nominations_pdf(session, category)
    filename = f"nominations-report-{category or 'all'}.pdf"
    return Response(
        content=data,
        media_type="application/pdf",
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
    rows = session.execute(stmt).all()

    # One grouped vote-count query for all nominees instead of one per row.
    nominee_ids = [n.id for n, _ in rows]
    counts: dict[int, int] = {}
    if nominee_ids:
        counts = {
            nid: cnt
            for nid, cnt in session.execute(
                select(Vote.nominee_id, func.count(Vote.id))
                .where(Vote.nominee_id.in_(nominee_ids))
                .group_by(Vote.nominee_id)
            ).all()
        }
    return [
        NomineeOut(
            id=n.id,
            category_slug=slug,
            display_name=n.display_name,
            summary=n.summary,
            photo_url=n.photo_url,
            vote_count=int(counts.get(n.id, 0)),
            is_winner=n.is_winner,
        )
        for n, slug in rows
    ]


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
    """Promote a nomination to a shortlisted nominee (eligible for voting).

    Idempotent: calling it again (e.g. a double-click) re-uses the existing
    nominee instead of creating a duplicate that would split the vote.
    """
    nomination = _get_nomination(session, nomination_id)
    nomination.status = NominationStatus.shortlisted
    display_name = summarize_submission(nomination.answers)["nominee_name"] or f"Nominee #{nomination.id}"

    nominee = session.scalar(
        select(Nominee).where(Nominee.source_nomination_id == nomination.id)
    )
    if nominee is None:
        nominee = Nominee(
            category_id=nomination.category_id,
            source_nomination_id=nomination.id,
            display_name=display_name,
            edition_year=nomination.category.edition_year,
            is_shortlisted=True,
        )
        session.add(nominee)
    else:
        # Re-shortlist a previously hidden nominee (e.g. after an un-reject).
        nominee.is_shortlisted = True
    session.commit()
    session.refresh(nominee)
    return _nominee_out(session, nominee, nomination.category.slug)


@router.delete("/nominees/{nominee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nominee(
    nominee_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> Response:
    """Remove a nominee from the voting slate. Deletes its votes too (a mistaken
    shortlist should leave no trace); use rejection to hide without deleting."""
    nominee = session.get(Nominee, nominee_id)
    if nominee is None:
        raise HTTPException(status_code=404, detail="Nominee not found")
    session.execute(Vote.__table__.delete().where(Vote.nominee_id == nominee_id))
    session.delete(nominee)
    session.commit()
    # Return an explicit bodyless Response so FastAPI doesn't infer a response
    # model for a 204 (which stricter versions reject at import time).
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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


def _parse_setting_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    # Coerce any legacy naive value to UTC so it compares safely with tz-aware ones.
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


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


def _validate_iso(value: str, field: str) -> datetime | None:
    if value == "":
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"{field} must be an ISO-8601 datetime")
    if parsed.tzinfo is None:
        # A naive value is ambiguous — the app compares against UTC, so a wall-clock
        # time entered without an offset would open/close voting in the wrong hour.
        raise HTTPException(
            status_code=422,
            detail=f"{field} must include a timezone offset (e.g. 2026-07-29T18:00:00+01:00 or ...Z)",
        )
    return parsed


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
    opens_dt = closes_dt = None
    if payload.voting_opens_at is not None:
        opens_dt = _validate_iso(payload.voting_opens_at, "voting_opens_at")
    if payload.voting_closes_at is not None:
        closes_dt = _validate_iso(payload.voting_closes_at, "voting_closes_at")

    # Compare against the effective window (incoming value, else what's stored).
    effective_opens = opens_dt if payload.voting_opens_at is not None else _parse_setting_dt(
        _read_setting(session, "voting_opens_at")
    )
    effective_closes = closes_dt if payload.voting_closes_at is not None else _parse_setting_dt(
        _read_setting(session, "voting_closes_at")
    )
    if effective_opens and effective_closes and effective_opens >= effective_closes:
        raise HTTPException(
            status_code=422, detail="voting_opens_at must be before voting_closes_at"
        )

    if payload.voting_opens_at is not None:
        _write_setting(session, "voting_opens_at", payload.voting_opens_at)
    if payload.voting_closes_at is not None:
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


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    session: Session = Depends(get_session),
    actor: User = Depends(require_admin),
) -> User:
    """Deactivate/reactivate, change role, or reset a user's password.

    Deactivating takes effect immediately (get_current_user re-checks `active` on
    every request), giving a real kill switch for a leaked account."""
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.active is False and user.id == actor.id:
        raise HTTPException(status_code=422, detail="You cannot deactivate your own account")
    if payload.role is not None:
        try:
            user.role = UserRole(payload.role)
        except ValueError:
            raise HTTPException(status_code=422, detail="role must be 'admin' or 'judge'")
    if payload.active is not None:
        user.active = payload.active
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
        # Invalidate any JWTs issued before this password change.
        user.token_version = (user.token_version or 0) + 1
    session.commit()
    session.refresh(user)
    return user


# --- Categories: operational toggles (admin only) -----------------------------

@router.get("/categories", response_model=list[CategoryFlags])
def list_category_flags(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[CategoryFlags]:
    cats = session.scalars(select(Category).order_by(Category.sort_order, Category.name)).all()
    return [
        CategoryFlags(
            slug=c.slug,
            name=c.name,
            nominations_open=c.nominations_open,
            voting_enabled=c.voting_enabled,
            active=c.active,
        )
        for c in cats
    ]


@router.patch("/categories/{slug}", response_model=CategoryFlags)
def update_category_flags(
    slug: str,
    payload: CategoryFlagsUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
) -> CategoryFlags:
    """Open/close nominations, enable/disable voting, or hide a category —
    without a redeploy or direct DB access."""
    category = _category_or_404(session, slug)
    if payload.nominations_open is not None:
        category.nominations_open = payload.nominations_open
    if payload.voting_enabled is not None:
        category.voting_enabled = payload.voting_enabled
    if payload.active is not None:
        category.active = payload.active
    session.commit()
    session.refresh(category)
    return CategoryFlags(
        slug=category.slug,
        name=category.name,
        nominations_open=category.nominations_open,
        voting_enabled=category.voting_enabled,
        active=category.active,
    )


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


_CSV_INJECTION_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _csv_safe(value):
    """Neutralize spreadsheet formula injection: a cell that begins with =,+,-,@
    (or tab/CR) is executed by Excel/Sheets on open. Prefix it with an apostrophe
    so user-supplied text is treated as literal text, not a formula."""
    if isinstance(value, str) and value and value[0] in _CSV_INJECTION_PREFIXES:
        return "'" + value
    return value


def _safe_writerow(writer, row) -> None:
    writer.writerow([_csv_safe(cell) for cell in row])
