"""FastAPI entrypoint — wires routers, CORS, and local upload serving.

Phase 2 adds the write surface: nomination submission, file uploads, newsletter
signup, JWT auth, and the admin/judging endpoints (review, status, scoring,
leaderboard, CSV export, user management).
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .routers import admin, auth, nominations, public, voting

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["public"])
def health() -> dict:
    return {"status": "ok", "edition_year": settings.edition_year}


app.include_router(public.router)
app.include_router(nominations.router)
app.include_router(voting.router)
app.include_router(auth.router)
app.include_router(admin.router)

# Serve locally-stored uploads in development. In production these live behind a
# CDN / blob store and this mount is unnecessary.
_upload_path = Path(settings.upload_dir)
_upload_path.mkdir(parents=True, exist_ok=True)
app.mount(settings.upload_base_url, StaticFiles(directory=_upload_path), name="uploads")
