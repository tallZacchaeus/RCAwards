"""Password hashing, JWT issuing/decoding, and auth dependencies."""
from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_session
from .models import User, UserRole

# --- Password hashing (PBKDF2-HMAC-SHA256, from the standard library) ---------

_PBKDF2_ROUNDS = 240_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${digest.hex()}"


def hash_ip(ip: str) -> str:
    """Stable, non-reversible hash of a client IP, salted with the app secret.

    Stored alongside votes as a secondary anti-fraud signal — we never keep the
    raw IP.
    """
    salt = get_settings().jwt_secret.encode()
    return hashlib.sha256(salt + ip.encode()).hexdigest()


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_hex = encoded.split("$")
        assert algorithm == "pbkdf2_sha256"
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds)
        )
    except (ValueError, AssertionError):
        return False
    return hmac.compare_digest(expected, actual)


# --- JWT ----------------------------------------------------------------------

def create_access_token(user: User) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


# --- Dependencies -------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _credentials_error
    user = session.scalar(select(User).where(User.id == user_id))
    if user is None or not user.active:
        raise _credentials_error
    return user


def require_roles(*roles: UserRole):
    """Dependency factory: allow only users whose role is in ``roles``."""

    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _checker


# Convenience dependencies
require_admin = require_roles(UserRole.admin)
require_staff = require_roles(UserRole.admin, UserRole.judge)
