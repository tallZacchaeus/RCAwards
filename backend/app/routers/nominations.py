"""Public nomination submission and file uploads."""
from __future__ import annotations

import re

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..antispam import check_honeypot
from ..config import get_settings
from ..db import get_session
from ..mailer import notify_nomination_received
from ..models import Category, Nomination, NominationFile
from ..ratelimit import rate_limit
from ..schemas.api import NominationCreate, NominationCreated, UploadResult
from ..schemas.form_schema import FormDefinition
from ..schemas.validation import validate_submission
from ..storage import save_upload
from ._helpers import summarize_submission

router = APIRouter(tags=["nominations"])


def _validate_file_ref_url(url: str) -> None:
    """Only accept URLs that point at our own upload store. A nomination's file
    URL is client-supplied and later rendered as a clickable link in the admin
    dashboard — an arbitrary external/`javascript:` URL would be a phishing/XSS
    vector, so reject anything that isn't `<upload_base_url>/<uuid>.<ext>`."""
    base = get_settings().upload_base_url.rstrip("/")
    pattern = rf"^{re.escape(base)}/[0-9a-f]{{32}}\.[a-z0-9]+$"
    if not re.match(pattern, url):
        raise HTTPException(
            status_code=422,
            detail={"field_errors": {"files": "Invalid file reference."}},
        )


@router.post(
    "/nominations",
    response_model=NominationCreated,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit)],
)
def create_nomination(
    payload: NominationCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> NominationCreated:
    check_honeypot(payload.website)
    category = session.scalar(
        select(Category).where(Category.slug == payload.category_slug)
    )
    if category is None or not category.active:
        raise HTTPException(status_code=404, detail="Category not found")
    if not category.nominations_open:
        raise HTTPException(status_code=409, detail="Nominations for this category are closed")

    # Validate the submission against the category's own form definition.
    form = FormDefinition.model_validate(category.form_schema)
    result = validate_submission(form, payload.answers)
    if not result.ok:
        raise HTTPException(status_code=422, detail={"field_errors": result.errors})

    summary = summarize_submission(payload.answers)
    nomination = Nomination(
        category_id=category.id,
        nominator_name=summary["nominator_name"],
        nominator_contact=summary["nominator_contact"],
        residency=summary["residency"],
        answers=payload.answers,
    )
    for ref in payload.files:
        _validate_file_ref_url(ref.url)
        nomination.files.append(
            NominationFile(field_key=ref.field_key, url=ref.url, kind=ref.kind)
        )
    session.add(nomination)
    session.commit()
    session.refresh(nomination)

    # Fire-and-forget confirmation to the nominator (no-op unless SMTP is
    # configured and the contact is an email); never blocks or fails the request.
    background_tasks.add_task(
        notify_nomination_received,
        summary["nominator_contact"],
        category.name,
        nomination.id,
    )

    return NominationCreated(
        id=nomination.id,
        category_slug=category.slug,
        status=nomination.status.value,
        created_at=nomination.created_at,
    )


@router.post(
    "/uploads",
    response_model=UploadResult,
    dependencies=[Depends(rate_limit)],
)
async def upload_file(file: UploadFile = File(...)) -> UploadResult:
    stored = await save_upload(file)
    return UploadResult(
        upload_id=stored.upload_id,
        url=stored.url,
        filename=stored.filename,
        content_type=stored.content_type,
        size=stored.size,
    )
