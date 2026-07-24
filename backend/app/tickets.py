"""Ticket booking helpers and PDF generation for the public ticket sales flow."""
from __future__ import annotations

import io
import logging
from typing import Any

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .config import get_settings
from .db import SessionLocal
from .mailer import send_email
from .models import Ticket
from .ticket_tokens import make_ticket_token

DEFAULT_TICKET_TYPE = "PEARL"
EVENT_TITLE = "The Redemption City Awards of Excellence"
EVENT_DATE = "Tuesday, 28 July 2026"
EVENT_LOCATION = "Redemption City Conference Hall"

logger = logging.getLogger("rcawards.tickets")


def _style_paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def _cell(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def check_in_payload(ticket: Ticket) -> str:
    """The string encoded in a ticket's QR: `RCAE-001|<token>`. The admin
    check-in scanner splits on `|` and posts both to the check-in endpoint,
    which re-verifies the token so a forged number is rejected at the door."""
    return f"{ticket.ticket_number}|{make_ticket_token(ticket.ticket_number)}"


def _qr_flowable(data: str, size_mm: float) -> Image:
    qr = qrcode.QRCode(border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1F1B16", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return Image(buffer, width=size_mm * mm, height=size_mm * mm)


def build_ticket_pdf(ticket: Ticket) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        title=f"Ticket {ticket.ticket_number}",
        author=EVENT_TITLE,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    heading = ParagraphStyle(
        "ticket_heading",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=32,
        textColor=colors.HexColor("#1F1B16"),
    )
    subheading = ParagraphStyle(
        "ticket_subheading",
        parent=styles["Heading2"],
        fontName="Helvetica",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#B98D2F"),
    )
    label = ParagraphStyle(
        "ticket_label",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#6B675F"),
    )
    value = ParagraphStyle(
        "ticket_value",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1F1B16"),
    )

    header = Paragraph(EVENT_TITLE, heading)
    subtitle = Paragraph("Admit One Guest", subheading)
    description = Paragraph(
        "Use this ticket as proof of booking for the Redemption City Awards of Excellence. "
        "You will be admitted to the ceremony on the event date listed below.",
        value,
    )

    number_style = ParagraphStyle(
        "ticket_number",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=30,
        textColor=colors.HexColor("#B98D2F"),
        alignment=1,
    )
    pearl_style = ParagraphStyle(
        "ticket_pearl",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=colors.white,
        alignment=1,
    )
    pearl_badge = Paragraph(f"{ticket.ticket_type or DEFAULT_TICKET_TYPE}".upper(), pearl_style)
    ticket_number_box = Table(
        [[Paragraph(ticket.ticket_number, number_style)]],
        colWidths=[70 * mm],
        rowHeights=[25 * mm],
        hAlign="RIGHT",
    )
    ticket_number_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8E0A7")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#B98D2F")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )

    table_data: list[list[Any]] = [
        [_cell("Ticket type", label), pearl_badge],
        [_cell("Name", label), _cell(f"{ticket.first_name} {ticket.last_name}", value)],
        [_cell("Email", label), _cell(ticket.email, value)],
        [_cell("Location", label), _cell(ticket.location, value)],
        [_cell("Event date", label), _cell(EVENT_DATE, value)],
        [_cell("Venue", label), _cell(EVENT_LOCATION, value)],
    ]

    table = Table(table_data, colWidths=[55 * mm, 100 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F5EFE3")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#B98D2F")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D9CEB8")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    small = ParagraphStyle(
        "ticket_small",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#6B675F"),
    )

    qr_caption = ParagraphStyle(
        "ticket_qr_caption",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#6B675F"),
        alignment=1,
    )
    qr_block = Table(
        [
            [_qr_flowable(check_in_payload(ticket), 30)],
            [Paragraph("Scan at entry", qr_caption)],
        ],
        colWidths=[40 * mm],
        hAlign="CENTER",
    )
    qr_block.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 1), (0, 1), 2),
            ]
        )
    )

    footer = Paragraph(
        "Please present this ticket at the registration desk. This ticket is non-transferable.",
        small,
    )
    note = Paragraph(
        f"Prepared by {get_settings().app_name}", small,
    )

    doc.build(
        [
            header,
            Spacer(1, 8 * mm),
            ticket_number_box,
            Spacer(1, 8 * mm),
            subtitle,
            Spacer(1, 4 * mm),
            description,
            Spacer(1, 10 * mm),
            table,
            Spacer(1, 12 * mm),
            qr_block,
            Spacer(1, 12 * mm),
            footer,
            Spacer(1, 3 * mm),
            note,
        ]
    )
    return buffer.getvalue()


def send_ticket_email(ticket_id: int) -> None:
    session = SessionLocal()
    try:
        ticket = session.get(Ticket, ticket_id)
        if ticket is None:
            logger.warning("Ticket not found for email send: %s", ticket_id)
            return

        pdf_bytes = build_ticket_pdf(ticket)
        subject = f"Your Redemption City Awards ticket {ticket.ticket_number}"
        body = (
            f"Thank you for booking a ticket for {EVENT_TITLE}. "
            f"Your ticket number is {ticket.ticket_number}. Please find your ticket attached."
        )
        send_email(
            to=ticket.email,
            subject=subject,
            body=body,
            attachments=[(f"{ticket.ticket_number}.pdf", pdf_bytes, "application/pdf")],
        )
        ticket.email_sent = True
        session.commit()
    except Exception:
        logger.exception("Failed to send ticket email for ticket %s", ticket_id)
        session.rollback()
    finally:
        session.close()
