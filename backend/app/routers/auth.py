"""Authentication: login (JWT), token refresh, and current-user lookup."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import User
from ..ratelimit import (
    check_login_allowed,
    login_key,
    rate_limit,
    record_login_failure,
    reset_login_failures,
)
from ..schemas.api import TokenResponse, UserOut
from ..security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit)])
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
) -> TokenResponse:
    # OAuth2PasswordRequestForm uses "username"; we treat it as the email.
    key = login_key(request, form.username)
    # Account-scoped brute-force lockout (stricter than the generic per-IP limit).
    check_login_allowed(key)

    user = session.scalar(select(User).where(User.email == form.username.lower()))
    if user is None or not user.active or not verify_password(form.password, user.password_hash):
        record_login_failure(key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    reset_login_failures(key)
    return TokenResponse(
        access_token=create_access_token(user),
        role=user.role.value,
        email=user.email,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(user: User = Depends(get_current_user)) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user),
        role=user.role.value,
        email=user.email,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
