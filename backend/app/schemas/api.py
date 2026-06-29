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
    role: str
    active: bool

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
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


class LeaderboardEntry(BaseModel):
    nomination_id: int
    nominee: Optional[str]
    average_total: float
    judge_count: int
    status: str
