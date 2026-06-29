"""Form-schema spec for the Redemption City Awards nomination engine.

Every award category is described by a *form definition* (a JSON document that
validates against ``FormDefinition`` below). The frontend renders any form from
this JSON and the backend validates submissions against the same source of
truth, so adding or editing a category is data, not code.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class FieldType(str, Enum):
    """Every input type a nomination form can use."""

    SHORT_TEXT = "short_text"
    PARAGRAPH = "paragraph"
    EMAIL = "email"
    PHONE = "phone"
    MULTIPLE_CHOICE = "multiple_choice"  # pick one from a small set (radios)
    DROPDOWN = "dropdown"  # pick one from a longer list (select)
    YES_NO = "yes_no"
    LINEAR_SCALE_1_10 = "linear_scale_1_10"  # 1 = Poor, 10 = Excellent
    FILE_UPLOAD = "file_upload"
    REGION_SELECT = "region_select"  # pick an RCCG region / Redemption City zone


class CategoryGroup(str, Enum):
    CITY = "city"
    REGIONAL = "regional"
    DEPARTMENTAL = "departmental"
    SATGO = "satgo"


CHOICE_TYPES = {FieldType.MULTIPLE_CHOICE, FieldType.DROPDOWN}


class Field_(BaseModel):
    """A single question on a form."""

    key: str = Field(..., description="Stable machine key, unique within a form.")
    label: str
    type: FieldType
    required: bool = True
    help: Optional[str] = None
    # Choice types only:
    options: Optional[list[str]] = None
    allow_other: bool = False  # renders an "Other (please specify)" free-text box
    # Paragraph / short text only:
    max_words: Optional[int] = None
    # File upload only:
    accept: Optional[list[str]] = None  # e.g. ["image/*", "application/pdf"]

    @model_validator(mode="after")
    def _check_shape(self) -> "Field_":
        if self.type in CHOICE_TYPES and not self.options:
            raise ValueError(f"field '{self.key}' is a choice type and needs options")
        if self.type not in CHOICE_TYPES and self.options:
            raise ValueError(f"field '{self.key}' has options but is not a choice type")
        if self.max_words is not None and self.type not in {
            FieldType.PARAGRAPH,
            FieldType.SHORT_TEXT,
        }:
            raise ValueError(f"field '{self.key}' uses max_words on a non-text type")
        return self


class Section(BaseModel):
    """A titled group of fields, mirroring the 'Section 1/2/3' in the source docs."""

    title: str
    description: Optional[str] = None
    fields: list[Field_]


class FormDefinition(BaseModel):
    """The complete, self-contained definition of one award category."""

    slug: str = Field(..., pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str
    group: CategoryGroup
    edition_year: int = 2026
    description: str
    voting_enabled: bool = True
    sort_order: int = 0
    sections: list[Section]

    @property
    def all_fields(self) -> list[Field_]:
        return [f for s in self.sections for f in s.fields]

    @model_validator(mode="after")
    def _unique_field_keys(self) -> "FormDefinition":
        keys = [f.key for f in self.all_fields]
        dupes = {k for k in keys if keys.count(k) > 1}
        if dupes:
            raise ValueError(f"duplicate field keys in '{self.slug}': {sorted(dupes)}")
        return self
