"""Application settings, loaded from the environment (.env in development)."""
from __future__ import annotations

import math
from collections import Counter
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_SECRETS = {"change-me-in-production", ""}
# Substrings that reveal a hand-typed / project-derived secret rather than a
# random one. A length check alone accepts phrases like
# "rcawards-2026-citybreed-jwt-secret-key-32bytes-min"; these do not.
_WEAK_SECRET_MARKERS = (
    "change", "secret", "password", "rcawards", "citybreed",
    "example", "default", "jwt", "please", "insecure",
)


def _shannon_bits(value: str) -> float:
    """Total Shannon entropy (bits) of a string — a coarse randomness proxy."""
    if not value:
        return 0.0
    counts = Counter(value)
    length = len(value)
    per_char = -sum((n / length) * math.log2(n / length) for n in counts.values())
    return per_char * length


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # "development" | "production". In production the app refuses to start with
    # insecure defaults (see the validator below).
    environment: str = "development"

    # MySQL connection. Override via DATABASE_URL in the environment.
    database_url: str = "mysql+pymysql://root:root@localhost:3306/rcawards"

    edition_year: int = 2026
    app_name: str = "Redemption City Awards API"

    # Public ticket capacity for the awards ceremony. Change TICKET_CAPACITY in
    # the environment to open or close seats without a code change or redeploy.
    ticket_capacity: int = 305

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

    # Vote anti-fraud: max votes accepted per category from one client IP. Set
    # generously so a shared NAT (e.g. a congregation on one Wi-Fi) is not blocked,
    # while still capping a script that rotates device fingerprints from one host.
    max_votes_per_ip_per_category: int = 40

    # Login brute-force lockout: after this many failed attempts (per email+IP)
    # within the window, further attempts are refused until the window elapses.
    login_max_failures: int = 8
    login_lockout_window_seconds: int = 900  # 15 minutes

    # Set to "/api" in production so FastAPI generates correct URLs behind Caddy's
    # /api prefix strip. Leave empty in development.
    root_path: str = ""

    # SMTP for outgoing email (optional — unset disables email sending).
    # Hostinger: smtp.hostinger.com, port 465 (implicit TLS), login = full mailbox address.
    smtp_host: str = ""
    smtp_port: int = 465
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""  # defaults to smtp_user when empty

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @model_validator(mode="after")
    def _guard_production(self) -> "Settings":
        if self.is_production:
            problems = []
            secret_lower = self.jwt_secret.lower()
            if self.jwt_secret in _INSECURE_SECRETS or len(self.jwt_secret) < 32:
                problems.append("JWT_SECRET must be a strong value of at least 32 bytes")
            elif any(marker in secret_lower for marker in _WEAK_SECRET_MARKERS):
                problems.append(
                    "JWT_SECRET looks hand-crafted (contains a dictionary/project word). "
                    "Use a random value, e.g. `openssl rand -hex 32`"
                )
            elif _shannon_bits(self.jwt_secret) < 128:
                problems.append(
                    "JWT_SECRET has too little entropy. Use a random value, "
                    "e.g. `openssl rand -hex 32`"
                )
            if self.database_url.startswith("mysql+pymysql://root:root@"):
                problems.append("DATABASE_URL still uses the default root credentials")
            if problems:
                raise ValueError(
                    "Insecure production configuration:\n  - " + "\n  - ".join(problems)
                )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
