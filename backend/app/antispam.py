"""Honeypot anti-spam for public write endpoints.

The request schemas carry a `website` field that is hidden from real users in the
UI. Bots that auto-fill every input will populate it; a non-empty value is a
strong bot signal, so we reject it.
"""
from __future__ import annotations

from fastapi import HTTPException, status


def check_honeypot(value: str) -> None:
    if value and value.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bad request")
