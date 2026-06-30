"""Pydantic request/response models for the HTTP API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# --- Categories ---------------------------------------------------------------

class CategorySummary(BaseModel):
    slug: str
    name: str
    group: str
    description: str
    voting_enabled: bool
    nominations_open: bool


class CategoryDetail(CategorySummary):
    form: dict[str, Any]


# --- Nominations --------------------------------------------------------------

class FileRef(BaseModel):
    field_key: str
    url: str
    kind: Optional[str] = None


class NominationCreate(BaseModel):
    category_slug: str
    answers: dict[str, Any]
    files: list[FileRef] = Field(default_factory=list)
    website: str = ""  # honeypot — must stay empty


class NominationCreated(BaseModel):
    id: int
    category_slug: str
    status: str
    created_at: datetime


class UploadResult(BaseModel):
    upload_id: str
    url: str
    filename: str
    content_type: str
    size: int


# --- Signup -------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: EmailStr
    website: str = ""  # honeypot — must stay empty


class SignupResult(BaseModel):
    email: EmailStr
    subscribed: bool


# --- Auth ---------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: str
    active: bool

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: Optional[str] = None
    role: str = "judge"


# --- Admin / judging ----------------------------------------------------------

class NominationListItem(BaseModel):
    id: int
    category_slug: str
    nominator_name: Optional[str]
    nominator_contact: Optional[str]
    status: str
    created_at: datetime


class NominationDetail(NominationListItem):
    residency: Optional[str]
    answers: dict[str, Any]
    files: list[FileRef]


class StatusUpdate(BaseModel):
    status: str  # submitted | shortlisted | rejected


class ScoreCreate(BaseModel):
    criteria: dict[str, int]  # {criterion_key: 1..10}


class ScoreOut(BaseModel):
    nomination_id: int
    judge_id: int
    criteria: dict[str, int]
    total: int


class CriterionAverage(BaseModel):
    key: str
    label: str
    average: float


class LeaderboardEntry(BaseModel):
    nomination_id: int
    nominee: Optional[str]
    ranked_score: float
    criteria: list[CriterionAverage]
    judge_count: int
    panel_size: int
    status: str


class CriterionOut(BaseModel):
    key: str
    label: str


# --- Voting -------------------------------------------------------------------

class NomineeOut(BaseModel):
    id: int
    category_slug: str
    display_name: str
    summary: Optional[str]
    photo_url: Optional[str]
    vote_count: int
    is_winner: bool


class NomineeCreate(BaseModel):
    category_slug: str
    display_name: str
    summary: Optional[str] = None
    photo_url: Optional[str] = None
    source_nomination_id: Optional[int] = None


class VoteCreate(BaseModel):
    nominee_id: int
    voter_fingerprint: str = Field(min_length=8, max_length=128)
    website: str = ""  # honeypot — must stay empty


class VoteResult(BaseModel):
    nominee_id: int
    vote_count: int
    voted: bool = True


class VotingStatus(BaseModel):
    open: bool
    opens_at: Optional[str]
    closes_at: Optional[str]
    results_public: bool


class SettingsOut(BaseModel):
    voting_opens_at: Optional[str]
    voting_closes_at: Optional[str]
    voting_results_public: bool


class SettingsUpdate(BaseModel):
    # Empty string clears a window bound; omit a field to leave it unchanged.
    voting_opens_at: Optional[str] = None
    voting_closes_at: Optional[str] = None
    voting_results_public: Optional[bool] = None
