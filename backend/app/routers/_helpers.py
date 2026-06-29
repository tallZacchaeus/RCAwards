"""Shared helpers for extracting denormalized fields from a submission.

Forms are heterogeneous, so we pull the nominator's name/contact, residency and a
best-effort nominee display name from well-known answer keys. These are stored
alongside the raw answers purely to make the admin listing scannable.
"""
from __future__ import annotations

from typing import Any

_NOMINATOR_NAME_KEYS = ("nominator_full_name", "nominator_name", "full_name")
_NOMINATOR_CONTACT_KEYS = ("nominator_contact", "nominator_email", "nominator_phone", "contact_info")
_RESIDENCY_KEYS = ("resides_in_city", "resides_in_region", "residency")
_NOMINEE_NAME_KEYS = (
    "nominee_full_name", "owner_full_name", "creche_name", "organisation_name",
    "business_name", "event_name", "school_name", "product_name", "region_name",
    "province_name",
)


def _first(answers: dict[str, Any], keys: tuple[str, ...]) -> Any | None:
    for key in keys:
        value = answers.get(key)
        if value not in (None, ""):
            return value
    return None


def summarize_submission(answers: dict[str, Any]) -> dict[str, Any]:
    return {
        "nominator_name": _first(answers, _NOMINATOR_NAME_KEYS),
        "nominator_contact": _first(answers, _NOMINATOR_CONTACT_KEYS),
        "residency": _stringify(_first(answers, _RESIDENCY_KEYS)),
        "nominee_name": _first(answers, _NOMINEE_NAME_KEYS),
    }


def _stringify(value: Any | None) -> str | None:
    return None if value is None else str(value)
