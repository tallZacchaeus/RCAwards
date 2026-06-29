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


@lru_cache
def get_settings() -> Settings:
    return Settings()
