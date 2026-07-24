"""Signed tokens for ticket PDFs and (later) QR check-in.

A ticket token is an HMAC-SHA256 of the ticket number keyed by the app's
jwt_secret, truncated to 128 bits and url-safe base64 encoded. It lets a ticket
number be turned into a link (PDF download now, QR check-in later) that the
server can verify but that cannot be forged without the secret. Stateless — no
column is needed; the same ticket number always maps to the same token.
"""
from __future__ import annotations

import base64
import hmac
from hashlib import sha256

from .config import get_settings

_TOKEN_BYTES = 16  # 128-bit tag → 22 url-safe base64 chars once padding is stripped


def make_ticket_token(ticket_number: str) -> str:
    secret = get_settings().jwt_secret.encode("utf-8")
    digest = hmac.new(secret, ticket_number.encode("utf-8"), sha256).digest()
    return base64.urlsafe_b64encode(digest[:_TOKEN_BYTES]).decode("ascii").rstrip("=")


def verify_ticket_token(ticket_number: str, token: str) -> bool:
    if not token:
        return False
    # compare_digest keeps the check constant-time so a token can't be guessed
    # byte-by-byte from response timing.
    return hmac.compare_digest(make_ticket_token(ticket_number), token)
