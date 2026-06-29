"""Public nomination submission and file uploads."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..antispam import check_honeypot
from ..db import get_session
from ..models import Category, Nomination, NominationFile
from ..ratelimit import rate_limit
from ..schemas.api import NominationCreate, NominationCreated, UploadResult
from ..schemas.form_schema import FormDefinition
from ..schemas.validation import validate_submission
from ..storage import save_upload
from ._helpers import summarize_submission

router = APIRouter(tags=["nominations"])


@router.post(
    "/nominations",
    response_model=NominationCreated,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit)],
)
def create_nomination(
    payload: NominationCreate, session: Session = Depends(get_session)
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
        nomination.files.append(
            NominationFile(field_key=ref.field_key, url=ref.url, kind=ref.kind)
        )
    session.add(nomination)
    session.commit()
    session.refresh(nomination)

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
