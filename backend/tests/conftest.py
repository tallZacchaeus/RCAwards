"""Test fixtures: an isolated SQLite database, seeded categories, and users.

Environment is configured *before* importing the app so the module-level engine
binds to the temp SQLite file and uploads land in a temp directory.
"""
import os
import tempfile

_TMP = tempfile.mkdtemp(prefix="rcawards-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP}/test.db"
os.environ["UPLOAD_DIR"] = f"{_TMP}/uploads"
os.environ["JWT_SECRET"] = "test-secret-key-at-least-32-bytes-long-000"
os.environ["RATE_LIMIT_REQUESTS"] = "100000"  # don't throttle the test client

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import models  # noqa: E402,F401  (register models on Base.metadata)
from app.db import Base, SessionLocal, get_engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User, UserRole  # noqa: E402
from app.security import hash_password  # noqa: E402
from app.seed.loader import seed_database  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _database():
    Base.metadata.create_all(get_engine())
    seed_database()
    session = SessionLocal()
    try:
        session.add(User(email="admin@rc.test", password_hash=hash_password("adminpass1"), role=UserRole.admin))
        session.add(User(email="judge@rc.test", password_hash=hash_password("judgepass1"), role=UserRole.judge))
        session.commit()
    finally:
        session.close()
    yield
    Base.metadata.drop_all(get_engine())


@pytest.fixture
def client():
    return TestClient(app)


def _token(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture
def admin_headers(client) -> dict:
    return {"Authorization": f"Bearer {_token(client, 'admin@rc.test', 'adminpass1')}"}


@pytest.fixture
def judge_headers(client) -> dict:
    return {"Authorization": f"Bearer {_token(client, 'judge@rc.test', 'judgepass1')}"}


def valid_creche_payload() -> dict:
    return {
        "category_slug": "creche-of-the-year",
        "answers": {
            "nominator_full_name": "Ada Obi",
            "nominator_contact": "ada@example.com",
            "relationship": "Parent/Guardian",
            "resides_in_city": "Yes",
            "creche_name": "Little Lights",
            "creche_location": "Zone 3",
            "staff_child_ratio": 8,
            "parental_satisfaction": 9,
            "cleanliness_safety": 10,
            "community_involvement": 7,
        },
    }
