"""Application settings, loaded from the environment (.env in development)."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # MySQL connection. Override via DATABASE_URL in the environment.
    database_url: str = "mysql+pymysql://root:root@localhost:3306/rcawards"

    edition_year: int = 2026
    app_name: str = "Redemption City Awards API"

    # Auth / JWT. CHANGE jwt_secret in every real environment.
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720  # 12 hours

    # File uploads
    upload_dir: str = "uploads"
    upload_base_url: str = "/uploads"
    max_upload_mb: int = 10
    allowed_upload_types: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "video/mp4",
    ]

    # CORS — the Next.js frontend origin(s).
    cors_origins: list[str] = ["http://localhost:3000"]

    # Simple per-IP rate limit for public write endpoints (fixed window).
    rate_limit_requests: int = 20
    rate_limit_window_seconds: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
