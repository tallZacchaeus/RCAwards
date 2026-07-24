"""Public ticket booking endpoints and availability checks."""
from __future__ import annotations

import logging
import re
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..antispam import check_honeypot
from ..config import get_settings
from ..db import get_session
from ..models import Ticket
from ..schemas.api import TicketAvailability, TicketCreated, TicketCreate
from ..ticket_tokens import make_ticket_token, verify_ticket_token
from ..tickets import build_ticket_pdf, send_ticket_email

logger = logging.getLogger("rcawards.tickets")
router = APIRouter(tags=["tickets"])

# {3,} rather than {3} so the scheme survives a capacity raised past 999 (four+
# digit ticket numbers still parse and print correctly).
_TICKET_NUMBER_RE = re.compile(r"^RCAE-(\d{3,})$")


def _parse_ticket_suffix(ticket_number: str) -> int | None:
    match = _TICKET_NUMBER_RE.match(ticket_number)
    return int(match.group(1)) if match else None


def _capacity() -> int:
    return get_settings().ticket_capacity


def _next_ticket_number(session: Session) -> str:
    capacity = _capacity()
    tickets = session.scalars(select(Ticket.ticket_number)).all()
    used = {
        _parse_ticket_suffix(ticket_number)
        for ticket_number in tickets
        if _parse_ticket_suffix(ticket_number) is not None
    }
    if len(used) >= capacity:
        raise RuntimeError("Tickets are sold out")
    for candidate in range(1, capacity + 1):
        if candidate not in used:
            return f"RCAE-{candidate:03d}"
    raise RuntimeError("Tickets are sold out")


@router.get("/tickets/availability", response_model=TicketAvailability)
def ticket_availability(session: Session = Depends(get_session)) -> TicketAvailability:
    capacity = _capacity()
    total = int(session.scalar(select(func.count(Ticket.id))) or 0)
    remaining = max(0, capacity - total)
    return TicketAvailability(available=remaining > 0, remaining=remaining, total=capacity)


@router.post("/tickets", response_model=TicketCreated, status_code=status.HTTP_201_CREATED)
def book_ticket(
    payload: TicketCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> TicketCreated:
    check_honeypot(payload.website)
    attempt = 0
    while attempt < 3:
        attempt += 1
        try:
            ticket = Ticket(
                ticket_number=_next_ticket_number(session),
                first_name=payload.first_name.strip(),
                last_name=payload.last_name.strip(),
                email=payload.email.strip().lower(),
                location=payload.location.strip(),
            )
            session.add(ticket)
            session.commit()
            session.refresh(ticket)
            background_tasks.add_task(send_ticket_email, ticket.id)
            return TicketCreated(
                id=ticket.id,
                ticket_number=ticket.ticket_number,
                first_name=ticket.first_name,
                last_name=ticket.last_name,
                email=ticket.email,
                location=ticket.location,
                created_at=ticket.created_at,
                token=make_ticket_token(ticket.ticket_number),
            )
        except IntegrityError:
            session.rollback()
            if attempt >= 3:
                raise HTTPException(status_code=500, detail="Could not allocate a ticket number")
        except RuntimeError as exc:
            session.rollback()
            raise HTTPException(status_code=409, detail=str(exc))


@router.get("/tickets/{ticket_number}/pdf")
def download_ticket_pdf(
    ticket_number: str,
    token: str,
    session: Session = Depends(get_session),
) -> Response:
    """Stream a booked ticket's PDF, gated by its signed token.

    This is the reliable-delivery fallback: the confirmation email may not
    arrive (SMTP down/misconfigured), but the booker can always download the
    same PDF straight from the success screen using the token they were issued.
    """
    if not verify_ticket_token(ticket_number, token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid ticket token")
    ticket = session.scalar(select(Ticket).where(Ticket.ticket_number == ticket_number))
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    pdf_bytes = build_ticket_pdf(ticket)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{ticket.ticket_number}.pdf"'},
    )


@router.post("/tickets/email", include_in_schema=False)
def ticket_email_hook(ticket_id: int) -> None:
    """Internal hook used by the public booking flow to send ticket emails."""
    send_ticket_email(ticket_id)
