"""FastAPI entrypoint — wires routers, CORS, and local upload serving.

Phase 2 adds the write surface: nomination submission, file uploads, newsletter
signup, JWT auth, and the admin/judging endpoints (review, status, scoring,
leaderboard, CSV export, user management).
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .config import get_settings
from .db import get_engine
from .routers import admin, auth, nominations, public, voting

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("rcawards")

settings = get_settings()
# Disable the interactive docs / OpenAPI schema in production so the admin API
# surface isn't enumerable by the public. root_path keeps generated URLs correct
# behind Caddy's /api prefix strip.
app = FastAPI(
    title=settings.app_name,
    root_path=settings.root_path,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This service serves JSON and user-uploaded files. A restrictive CSP makes any
# uploaded HTML/SVG inert (it can't run scripts or be framed), and doesn't affect
# JSON responses. The Next.js frontend sets its own, page-appropriate CSP.
_CSP = "default-src 'none'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = _CSP
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log unhandled errors with request context and return a stable shape,
    instead of leaking a bare stack-trace 500."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["public"])
def health() -> JSONResponse:
    """Liveness + DB readiness — a wedged DB pool should fail the healthcheck."""
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check DB probe failed")
        return JSONResponse(status_code=503, content={"status": "degraded", "database": "down"})
    return JSONResponse({"status": "ok", "edition_year": settings.edition_year, "database": "ok"})


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
