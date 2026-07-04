"""Public voting: nominee galleries and casting a vote (with anti-fraud)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..antispam import check_honeypot
from ..config import get_settings
from ..db import get_session
from ..models import Category, Nominee, Setting, Vote
from ..ratelimit import rate_limit
from ..schemas.api import NomineeOut, VoteCreate, VoteResult, VotingStatus
from ..security import hash_ip

router = APIRouter(tags=["voting"])


def _conflict(code: str, message: str, status_code: int = status.HTTP_409_CONFLICT) -> HTTPException:
    """A machine-readable client error so the frontend can branch on `code`
    instead of matching on human-readable message text."""
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})

# Settings keys (rows in the `settings` table).
KEY_OPENS = "voting_opens_at"
KEY_CLOSES = "voting_closes_at"
KEY_RESULTS_PUBLIC = "voting_results_public"  # "true"/"false"


def _get_setting(session: Session, key: str) -> str | None:
    row = session.get(Setting, key)
    return row.value if row else None


def _parse(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    if dt.tzinfo:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _voting_open(session: Session) -> bool:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    opens = _get_setting(session, KEY_OPENS)
    closes = _get_setting(session, KEY_CLOSES)
    if opens and now < _parse(opens):
        return False
    if closes and now > _parse(closes):
        return False
    return True  # open by default when no window is configured


def _results_public(session: Session) -> bool:
    val = _get_setting(session, KEY_RESULTS_PUBLIC)
    return val is None or val.lower() == "true"


def _vote_counts(session: Session, nominee_ids: list[int]) -> dict[int, int]:
    if not nominee_ids:
        return {}
    rows = session.execute(
        select(Vote.nominee_id, func.count(Vote.id))
        .where(Vote.nominee_id.in_(nominee_ids))
        .group_by(Vote.nominee_id)
    ).all()
    return {nid: count for nid, count in rows}


@router.get("/voting/status", response_model=VotingStatus)
def voting_status(session: Session = Depends(get_session)) -> VotingStatus:
    return VotingStatus(
        open=_voting_open(session),
        opens_at=_get_setting(session, KEY_OPENS),
        closes_at=_get_setting(session, KEY_CLOSES),
        results_public=_results_public(session),
    )


@router.get("/nominees", response_model=list[NomineeOut])
def list_nominees(
    category: str = Query(..., description="Category slug"),
    session: Session = Depends(get_session),
) -> list[NomineeOut]:
    cat = session.scalar(select(Category).where(Category.slug == category))
    if cat is None or not cat.active:
        raise HTTPException(status_code=404, detail="Category not found")

    nominees = list(
        session.scalars(
            select(Nominee)
            .where(Nominee.category_id == cat.id, Nominee.is_shortlisted)
            .order_by(Nominee.display_name)
        ).all()
    )
    counts = _vote_counts(session, [n.id for n in nominees])
    show = _results_public(session)
    return [
        NomineeOut(
            id=n.id,
            category_slug=cat.slug,
            display_name=n.display_name,
            summary=n.summary,
            photo_url=n.photo_url,
            vote_count=counts.get(n.id, 0) if show else 0,
            is_winner=n.is_winner,
        )
        for n in nominees
    ]


@router.post("/votes", response_model=VoteResult, dependencies=[Depends(rate_limit)])
def cast_vote(
    payload: VoteCreate, request: Request, session: Session = Depends(get_session)
) -> VoteResult:
    check_honeypot(payload.website)
    nominee = session.get(Nominee, payload.nominee_id)
    if nominee is None or not nominee.is_shortlisted:
        raise HTTPException(status_code=404, detail="Nominee not found")

    category = session.get(Category, nominee.category_id)
    if category is None or not category.active or not category.voting_enabled:
        raise _conflict("voting_not_enabled", "Voting is not enabled for this category.")

    if not _voting_open(session):
        raise _conflict("voting_closed", "Voting is currently closed.")

    # One vote per category per device (fingerprint). This SELECT is a fast path
    # for a friendly message; the DB constraint (uq_vote_once_per_category) is the
    # real, race-proof guarantee — enforced below via IntegrityError.
    already = session.scalar(
        select(Vote.id)
        .where(
            Vote.category_id == category.id,
            Vote.voter_fingerprint == payload.voter_fingerprint,
        )
        .limit(1)
    )
    if already:
        raise _conflict("already_voted", "You have already voted in this category.")

    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hash_ip(client_ip)

    # Secondary anti-fraud: cap votes per category from a single IP. Defeats a
    # script that rotates client-supplied fingerprints from one host, while the
    # generous default still allows many legitimate voters behind one NAT.
    settings = get_settings()
    if request.client is not None:
        ip_votes = session.scalar(
            select(func.count(Vote.id)).where(
                Vote.category_id == category.id, Vote.ip_hash == ip_hash
            )
        ) or 0
        if ip_votes >= settings.max_votes_per_ip_per_category:
            raise _conflict(
                "vote_limit",
                "This network has reached the voting limit for this category.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            )

    vote = Vote(
        nominee_id=nominee.id,
        category_id=category.id,
        voter_fingerprint=payload.voter_fingerprint,
        ip_hash=ip_hash,
    )
    session.add(vote)
    try:
        session.commit()
    except IntegrityError:
        # Unique (category_id, fingerprint) or (nominee_id, fingerprint) — a
        # concurrent double-submit lost the race. Same outcome for the client.
        session.rollback()
        raise _conflict("already_voted", "You have already voted in this category.")

    # Don't leak live standings while results are private.
    if _results_public(session):
        count = session.scalar(
            select(func.count(Vote.id)).where(Vote.nominee_id == nominee.id)
        )
        return VoteResult(nominee_id=nominee.id, vote_count=int(count or 0))
    return VoteResult(nominee_id=nominee.id, vote_count=0)
