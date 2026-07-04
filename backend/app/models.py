"""SQLAlchemy models for the Redemption City Awards platform.

Phase 1 centres on ``Category`` (which stores the form definition as JSON),
``Nomination`` and ``NominationFile``. The remaining tables are defined now so
the initial migration is forward-looking for voting, judging and the gallery
(Phases 2, 5 and 6) without later schema churn.
"""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class CategoryGroup(str, enum.Enum):
    city = "city"
    regional = "regional"
    departmental = "departmental"
    satgo = "satgo"


class NominationStatus(str, enum.Enum):
    submitted = "submitted"
    shortlisted = "shortlisted"
    rejected = "rejected"


class UserRole(str, enum.Enum):
    admin = "admin"
    judge = "judge"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    group: Mapped[CategoryGroup] = mapped_column(Enum(CategoryGroup))
    description: Mapped[str] = mapped_column(Text)
    # The full FormDefinition JSON — the single source of truth for the form.
    form_schema: Mapped[dict] = mapped_column(JSON)
    edition_year: Mapped[int] = mapped_column(Integer, default=2026)
    voting_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    nominations_open: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    nominations: Mapped[list["Nomination"]] = relationship(back_populates="category")
    nominees: Mapped[list["Nominee"]] = relationship(back_populates="category")


class Nomination(Base):
    __tablename__ = "nominations"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    nominator_name: Mapped[str | None] = mapped_column(String(200))
    nominator_contact: Mapped[str | None] = mapped_column(String(200))
    residency: Mapped[str | None] = mapped_column(String(120))
    # The validated {field_key: value} answer map.
    answers: Mapped[dict] = mapped_column(JSON)
    status: Mapped[NominationStatus] = mapped_column(
        Enum(NominationStatus), default=NominationStatus.submitted, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    category: Mapped[Category] = relationship(back_populates="nominations")
    files: Mapped[list["NominationFile"]] = relationship(
        back_populates="nomination", cascade="all, delete-orphan"
    )
    scores: Mapped[list["Score"]] = relationship(back_populates="nomination")


class NominationFile(Base):
    __tablename__ = "nomination_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    nomination_id: Mapped[int] = mapped_column(
        ForeignKey("nominations.id", ondelete="CASCADE"), index=True
    )
    field_key: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(String(500))
    kind: Mapped[str | None] = mapped_column(String(80))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nomination: Mapped[Nomination] = relationship(back_populates="files")


class Nominee(Base):
    """A shortlisted entry surfaced for public voting and the winners gallery."""

    __tablename__ = "nominees"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    source_nomination_id: Mapped[int | None] = mapped_column(ForeignKey("nominations.id"))
    display_name: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    edition_year: Mapped[int] = mapped_column(Integer, default=2026)
    is_shortlisted: Mapped[bool] = mapped_column(Boolean, default=True)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped[Category] = relationship(back_populates="nominees")
    votes: Mapped[list["Vote"]] = relationship(back_populates="nominee")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("nominee_id", "voter_fingerprint", name="uq_vote_once"),
        # One vote per category per device. Enforced in the schema (not just a
        # check-then-insert) so concurrent requests cannot slip past a race.
        UniqueConstraint("category_id", "voter_fingerprint", name="uq_vote_once_per_category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nominee_id: Mapped[int] = mapped_column(ForeignKey("nominees.id"), index=True)
    # Denormalized from the nominee so the per-category uniqueness constraint can
    # exist at the database level.
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    voter_fingerprint: Mapped[str] = mapped_column(String(128), index=True)
    ip_hash: Mapped[str | None] = mapped_column(String(128), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nominee: Mapped[Nominee] = relationship(back_populates="votes")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.judge)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Bumped whenever the password changes (or a manual revoke) so previously
    # issued JWTs stop validating — real revocation without server-side sessions.
    token_version: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    scores: Mapped[list["Score"]] = relationship(back_populates="judge")


class Score(Base):
    """A judge's evaluation of a nomination against the category's criteria."""

    __tablename__ = "scores"
    __table_args__ = (
        UniqueConstraint("nomination_id", "judge_id", name="uq_score_once"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nomination_id: Mapped[int] = mapped_column(ForeignKey("nominations.id"), index=True)
    judge_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    criteria: Mapped[dict] = mapped_column(JSON)  # {field_key: score}
    total: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nomination: Mapped[Nomination] = relationship(back_populates="scores")
    judge: Mapped[User] = relationship(back_populates="scores")


class Setting(Base):
    """Key/value runtime config: countdown date, nomination & voting windows."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text)


class Subscriber(Base):
    """Newsletter / "be first to know" signups from the marketing site."""

    __tablename__ = "subscribers"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
