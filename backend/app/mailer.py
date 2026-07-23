"""Outgoing email over SMTP (Hostinger or any provider with implicit-TLS SMTP).

send_email() raises when SMTP is unconfigured or delivery fails, so callers can
decide if that's fatal. notify_nomination_received() is the fire-and-forget
variant used from a BackgroundTask — it never raises, so a mail hiccup can't
affect the request.
"""
from __future__ import annotations

import logging
import re
import smtplib
from email.message import EmailMessage

from .config import get_settings

logger = logging.getLogger("rcawards.mailer")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_configured() -> bool:
    s = get_settings()
    return bool(s.smtp_host and s.smtp_user and s.smtp_password)


def send_email(
    to: str,
    subject: str,
    body: str,
    *,
    html: str | None = None,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> None:
    """Send a plain-text email (optionally with HTML and attachments).

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

    if attachments:
        for filename, data, content_type in attachments:
            maintype, subtype = content_type.split("/", 1)
            msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    with smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=20) as smtp:
        smtp.login(s.smtp_user, s.smtp_password)
        smtp.send_message(msg)


def notify_nomination_received(contact: str | None, category_name: str, nomination_id: int) -> None:
    """Best-effort confirmation email to the nominator. No-op when SMTP is
    unconfigured or the contact isn't an email address; never raises (safe to run
    as a BackgroundTask). Blocking SMTP work stays off the request path."""
    if not contact or not _EMAIL_RE.match(contact.strip()):
        return
    if not is_configured():
        return
    try:
        send_email(
            to=contact.strip(),
            subject=f"We received your nomination · {category_name}",
            body=(
                "Thank you for recognising excellence at the Redemption City Award "
                f"of Excellence.\n\nYour nomination for “{category_name}” has been "
                f"received (reference #{nomination_id}) and will be reviewed by the "
                "judging committee.\n\n— City Breed"
            ),
        )
    except Exception:
        logger.warning("Failed to send nomination confirmation for #%s", nomination_id, exc_info=True)
