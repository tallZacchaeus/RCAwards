"""File storage. Local-disk implementation for development.

Returns a public URL reference that nomination submissions store. The interface
is deliberately tiny so an S3/blob backend can replace it in Phase 7 without
touching the routers.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from .config import get_settings

_EXT_BY_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
}


@dataclass
class StoredFile:
    upload_id: str
    url: str
    filename: str
    content_type: str
    size: int


async def save_upload(file: UploadFile) -> StoredFile:
    settings = get_settings()

    if file.content_type not in settings.allowed_upload_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    data = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_mb} MB limit",
        )

    upload_id = uuid.uuid4().hex
    ext = _EXT_BY_TYPE.get(file.content_type, "")
    stored_name = f"{upload_id}{ext}"

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / stored_name).write_bytes(data)

    return StoredFile(
        upload_id=upload_id,
        url=f"{settings.upload_base_url}/{stored_name}",
        filename=file.filename or stored_name,
        content_type=file.content_type,
        size=len(data),
    )
