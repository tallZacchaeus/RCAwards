"""Outgoing email over SMTP (Hostinger or any provider with implicit-TLS SMTP).

Not wired into any endpoint yet — import send_email() where a flow needs it
(e.g. nomination confirmations). Configure via SMTP_* environment variables;
with SMTP unset, is_configured() is False and send_email() raises.
"""
from __future__ import annotations

import smtplib
from email.message import EmailMessage

from .config import get_settings


def is_configured() -> bool:
    s = get_settings()
    return bool(s.smtp_host and s.smtp_user and s.smtp_password)


def send_email(to: str, subject: str, body: str, *, html: str | None = None) -> None:
    """Send a plain-text email (optionally with an HTML alternative).

    Raises RuntimeError when SMTP is unconfigured and smtplib exceptions on
    delivery failure — callers decide whether that is fatal for their flow.
    """
    s = get_settings()
    if not is_configured():
        raise RuntimeError("SMTP is not configured (set SMTP_HOST/SMTP_USER/SMTP_PASSWORD)")

    msg = EmailMessage()
    msg["From"] = s.smtp_from or s.smtp_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    if html is not None:
        msg.add_alternative(html, subtype="html")

    with smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=20) as smtp:
        smtp.login(s.smtp_user, s.smtp_password)
        smtp.send_message(msg)
