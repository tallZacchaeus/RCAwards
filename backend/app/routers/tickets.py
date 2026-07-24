"""Public ticket booking endpoints and availability checks."""
from __future__ import annotations

import logging
import re
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..antispam import check_honeypot
from ..db import get_session
from ..models import Ticket
from ..schemas.api import TicketAvailability, TicketCreated, TicketCreate
from ..tickets import send_ticket_email

logger = logging.getLogger("rcawards.tickets")
router = APIRouter(tags=["tickets"])

_TICKET_NUMBER_RE = re.compile(r"^RCAE-(\d{3})$")


def _parse_ticket_suffix(ticket_number: str) -> int | None:
    match = _TICKET_NUMBER_RE.match(ticket_number)
    return int(match.group(1)) if match else None


def _next_ticket_number(session: Session) -> str:
    tickets = session.scalars(select(Ticket.ticket_number)).all()
    used = {
        _parse_ticket_suffix(ticket_number)
        for ticket_number in tickets
        if _parse_ticket_suffix(ticket_number) is not None
    }
    if len(used) >= 305:
        raise RuntimeError("Tickets are sold out")
    for candidate in range(1, 306):
        if candidate not in used:
            return f"RCAE-{candidate:03d}"
    raise RuntimeError("Tickets are sold out")


@router.get("/tickets/availability", response_model=TicketAvailability)
def ticket_availability(session: Session = Depends(get_session)) -> TicketAvailability:
    total = int(session.scalar(select(func.count(Ticket.id))) or 0)
    remaining = max(0, 305 - total)
    return TicketAvailability(available=remaining > 0, remaining=remaining, total=305)


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
            )
        except IntegrityError:
            session.rollback()
            if attempt >= 3:
                raise HTTPException(status_code=500, detail="Could not allocate a ticket number")
        except RuntimeError as exc:
            session.rollback()
            raise HTTPException(status_code=409, detail=str(exc))


@router.post("/tickets/email", include_in_schema=False)
def ticket_email_hook(ticket_id: int) -> None:
    """Internal hook used by the public booking flow to send ticket emails."""
    send_ticket_email(ticket_id)
