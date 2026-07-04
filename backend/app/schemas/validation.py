"""Validate a nomination submission against a category's form definition.

The same ``FormDefinition`` the frontend renders is the contract the backend
enforces, so a malformed or tampered submission is rejected server-side.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from .form_schema import FieldType, Field_, FormDefinition

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_OTHER_SUFFIX = "__other"  # answers[f"{key}__other"] holds the free-text for "Other"

# Per-field character caps. A clean 422 beats silent truncation of the
# denormalized columns (or a MySQL "Data too long" 500 in strict mode).
_MAX_SHORT_TEXT = 500
_MAX_PARAGRAPH = 5000
_MAX_EMAIL = 254


@dataclass
class ValidationResult:
    errors: dict[str, str] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return not self.errors

    def add(self, key: str, message: str) -> None:
        self.errors.setdefault(key, message)


def _word_count(value: str) -> int:
    return len(value.split())


def _validate_field(f: Field_, value: Any, answers: dict[str, Any], result: ValidationResult) -> None:
    missing = value is None or (isinstance(value, str) and not value.strip())
    if missing:
        if f.required:
            result.add(f.key, "This field is required.")
        return

    if f.type in {FieldType.SHORT_TEXT, FieldType.PARAGRAPH}:
        cap = _MAX_PARAGRAPH if f.type == FieldType.PARAGRAPH else _MAX_SHORT_TEXT
        if not isinstance(value, str):
            result.add(f.key, "Expected text.")
        elif len(value) > cap:
            result.add(f.key, f"Please keep this under {cap} characters.")
        elif f.max_words and _word_count(value) > f.max_words:
            result.add(f.key, f"Please keep this under {f.max_words} words.")

    elif f.type == FieldType.EMAIL:
        if not isinstance(value, str) or len(value) > _MAX_EMAIL or not _EMAIL_RE.match(value):
            result.add(f.key, "Enter a valid email address.")

    elif f.type == FieldType.PHONE:
        digits = re.sub(r"\D", "", str(value))
        if len(digits) < 7:
            result.add(f.key, "Enter a valid phone number.")

    elif f.type == FieldType.YES_NO:
        if str(value).strip().lower() not in {"yes", "no"}:
            result.add(f.key, "Choose Yes or No.")

    elif f.type == FieldType.LINEAR_SCALE_1_10:
        try:
            n = int(value)
        except (TypeError, ValueError):
            result.add(f.key, "Choose a rating from 1 to 10.")
        else:
            if not 1 <= n <= 10:
                result.add(f.key, "Rating must be between 1 and 10.")

    elif f.type in {FieldType.MULTIPLE_CHOICE, FieldType.DROPDOWN}:
        options = f.options or []
        if value not in options:
            result.add(f.key, "Choose one of the provided options.")
        elif f.allow_other and value == _other_option(options):
            other = answers.get(f.key + _OTHER_SUFFIX)
            if not (isinstance(other, str) and other.strip()):
                result.add(f.key + _OTHER_SUFFIX, "Please specify.")

    elif f.type == FieldType.FILE_UPLOAD:
        # The API stores uploads separately and passes a reference (url/id) here.
        if not isinstance(value, (str, list)):
            result.add(f.key, "Invalid file reference.")

    elif f.type == FieldType.REGION_SELECT:
        if not isinstance(value, str) or not value.strip():
            result.add(f.key, "Select a region.")


def _other_option(options: list[str]) -> str | None:
    for opt in options:
        if opt.lower().startswith("other"):
            return opt
    return None


def validate_submission(form: FormDefinition, answers: dict[str, Any]) -> ValidationResult:
    """Validate ``answers`` (a ``{field_key: value}`` map) against ``form``."""
    result = ValidationResult()
    for f in form.all_fields:
        _validate_field(f, answers.get(f.key), answers, result)
    return result
