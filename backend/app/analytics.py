"""Read-only aggregation of nomination data for the admin analytics dashboard,
the Excel export and the PDF report.

One function, ``compute_nomination_analytics``, returns a plain dict (shaped like
``schemas.api.NominationAnalytics``) so the JSON endpoint, the workbook builder
and the report builder all share exactly the same numbers. Every query is a
grouped aggregate — no per-nomination round-trips — so it stays cheap even as
submissions grow.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from .models import Category, Nomination, NominationFile, NominationStatus


def _utcnow_naive() -> datetime:
    # created_at is stored naive (DB ``func.now()``); compare against a naive UTC
    # instant so the velocity windows line up regardless of the driver.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def compute_nomination_analytics(
    session: Session, category_slug: Optional[str] = None
) -> dict[str, Any]:
    """Aggregate nomination stats, optionally scoped to a single category.

    When ``category_slug`` names a category that doesn't exist, the result is an
    empty (all-zero) report — callers that want a 404 should validate the slug
    first.
    """
    target: Optional[Category] = None
    if category_slug:
        target = session.scalar(select(Category).where(Category.slug == category_slug))

    def scoped(stmt):
        """Restrict a nomination aggregate to the target category when set."""
        return stmt.where(Nomination.category_id == target.id) if target else stmt

    # Categories in scope, in display order.
    cats_stmt = select(Category).order_by(Category.sort_order, Category.name)
    if target:
        cats_stmt = cats_stmt.where(Category.id == target.id)
    categories = list(session.scalars(cats_stmt))

    # counts per (category_id, status) in a single grouped query
    counts_stmt = scoped(
        select(Nomination.category_id, Nomination.status, func.count(Nomination.id))
        .group_by(Nomination.category_id, Nomination.status)
    )
    per_cat: dict[int, dict[NominationStatus, int]] = {}
    for cat_id, st, n in session.execute(counts_stmt):
        per_cat.setdefault(cat_id, {})[st] = n

    by_category: list[dict[str, Any]] = []
    empty_categories: list[str] = []
    by_group: dict[str, int] = {}
    status_totals = {"submitted": 0, "shortlisted": 0, "rejected": 0}
    total = 0
    categories_with_entries = 0

    for cat in categories:
        sc = per_cat.get(cat.id, {})
        sub = sc.get(NominationStatus.submitted, 0)
        shortlisted = sc.get(NominationStatus.shortlisted, 0)
        rejected = sc.get(NominationStatus.rejected, 0)
        count = sub + shortlisted + rejected
        total += count
        status_totals["submitted"] += sub
        status_totals["shortlisted"] += shortlisted
        status_totals["rejected"] += rejected
        group = cat.group.value if hasattr(cat.group, "value") else str(cat.group)
        by_group[group] = by_group.get(group, 0) + count
        if count == 0:
            empty_categories.append(cat.name)
        else:
            categories_with_entries += 1
        by_category.append({
            "slug": cat.slug,
            "name": cat.name,
            "group": group,
            "count": count,
            "submitted": sub,
            "shortlisted": shortlisted,
            "rejected": rejected,
        })

    # Busiest category first; the empty ones sink to the bottom.
    by_category.sort(key=lambda c: (-c["count"], c["name"].lower()))

    unique_nominators = session.scalar(
        scoped(
            select(func.count(distinct(Nomination.nominator_contact)))
            .where(Nomination.nominator_contact.is_not(None))
        )
    ) or 0

    evidence_stmt = (
        select(func.count(distinct(NominationFile.nomination_id)))
        .select_from(NominationFile)
        .join(Nomination, NominationFile.nomination_id == Nomination.id)
    )
    if target:
        evidence_stmt = evidence_stmt.where(Nomination.category_id == target.id)
    with_evidence = session.scalar(evidence_stmt) or 0

    # Daily submission counts (``func.date`` yields 'YYYY-MM-DD' on SQLite and a
    # date on MariaDB; ``str`` normalises both).
    timeline = [
        {"date": str(day), "count": n}
        for day, n in session.execute(
            scoped(
                select(func.date(Nomination.created_at), func.count(Nomination.id))
                .group_by(func.date(Nomination.created_at))
                .order_by(func.date(Nomination.created_at))
            )
        )
    ]

    now = _utcnow_naive()

    def since(delta: timedelta) -> int:
        return session.scalar(
            scoped(select(func.count(Nomination.id)).where(Nomination.created_at >= now - delta))
        ) or 0

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": category_slug or "all",
        "total": total,
        "categories_total": len(categories),
        "categories_with_entries": categories_with_entries,
        "categories_empty": len(empty_categories),
        "unique_nominators": unique_nominators,
        "with_evidence": with_evidence,
        "last_24h": since(timedelta(hours=24)),
        "last_7d": since(timedelta(days=7)),
        "status": status_totals,
        "by_category": by_category,
        "empty_categories": empty_categories,
        "by_group": [{"group": g, "count": c} for g, c in sorted(by_group.items())],
        "timeline": timeline,
    }
