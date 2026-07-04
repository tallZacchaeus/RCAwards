"""Small management CLI for operational tasks.

Usage:
    python -m app.manage create-admin --email you@example.com --password 'a-strong-password'
    python -m app.manage create-user  --email judge@example.com --password 'a-strong-password' --role judge
    python -m app.manage seed-judges          # generates a unique random password per judge
    python -m app.manage reset-password --email judge@example.com   # rotate one account's password
"""
from __future__ import annotations

import argparse
import re
import secrets
import sys

from sqlalchemy import select

from .db import SessionLocal
from .models import User, UserRole
from .security import hash_password


def _new_password() -> str:
    """A short, unambiguous, random one-time password (~52 bits)."""
    return secrets.token_urlsafe(10)

# The 2025 judging panel (from the committee's judging sheet). Emails are
# placeholders under @judges.rcawards.local — reset them and the shared password
# before go-live.
JUDGE_PANEL = [
    "Pastor Dare", "Pastor Osoba", "Pastor Kunle", "Pastor Isaiah", "Dr. Peter",
    "Pastor Olumide", "Pastor Cole", "Sis. Tolu", "Oluwafunmilola", "TA",
    "Sis. Jumoke", "Sis. Tosin", "Pastor Femi", "Israel O. Ishima",
]


def _slug_email(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{slug}@judges.rcawards.local"


def _create_user(email: str, password: str, role: str, name: str | None = None) -> None:
    if len(password) < 8:
        sys.exit("Password must be at least 8 characters.")
    try:
        user_role = UserRole(role)
    except ValueError:
        sys.exit("Role must be 'admin' or 'judge'.")

    session = SessionLocal()
    try:
        email = email.lower()
        if session.scalar(select(User).where(User.email == email)):
            sys.exit(f"A user with email {email} already exists.")
        session.add(
            User(email=email, name=name, password_hash=hash_password(password), role=user_role)
        )
        session.commit()
        print(f"✓ Created {user_role.value}: {email}")
    finally:
        session.close()


def _seed_judges() -> None:
    """Create the panel, each with its own random one-time password.

    Prints a credentials table once — save it, distribute each judge their own
    password, and have them change it on first login. No shared password.
    """
    session = SessionLocal()
    created: list[tuple[str, str, str]] = []
    skipped = 0
    try:
        for name in JUDGE_PANEL:
            email = _slug_email(name)
            if session.scalar(select(User).where(User.email == email)):
                skipped += 1
                continue
            password = _new_password()
            session.add(
                User(email=email, name=name, password_hash=hash_password(password), role=UserRole.judge)
            )
            created.append((name, email, password))
        session.commit()
    finally:
        session.close()

    print(f"✓ Seeded judge panel: {len(created)} created, {skipped} already existed.")
    if created:
        print("\n  ONE-TIME CREDENTIALS — record these now, they are not recoverable:\n")
        for name, email, password in created:
            print(f"    {name:<20} {email:<40} {password}")
        print("\n  Emails are @judges.rcawards.local placeholders — update to real")
        print("  mailboxes before go-live, and have each judge change their password.")


def _reset_password(email: str) -> None:
    session = SessionLocal()
    try:
        email = email.lower()
        user = session.scalar(select(User).where(User.email == email))
        if user is None:
            sys.exit(f"No user with email {email}.")
        password = _new_password()
        user.password_hash = hash_password(password)
        user.token_version = (user.token_version or 0) + 1  # revoke existing tokens
        session.commit()
        print(f"✓ New password for {email}: {password}")
    finally:
        session.close()


def _cleanup_uploads(min_age_hours: int) -> None:
    """Delete stored upload files that no nomination references and that are older
    than min_age_hours (the grace period avoids deleting a file uploaded but not
    yet submitted with its nomination)."""
    import time
    from pathlib import Path

    from .config import get_settings
    from .models import NominationFile

    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    if not upload_dir.exists():
        print("Upload directory does not exist; nothing to do.")
        return

    session = SessionLocal()
    try:
        referenced = {
            (row or "").rsplit("/", 1)[-1]
            for row in session.scalars(select(NominationFile.url)).all()
        }
    finally:
        session.close()

    cutoff = time.time() - min_age_hours * 3600
    removed = kept = 0
    for path in upload_dir.iterdir():
        if not path.is_file():
            continue
        if path.name in referenced or path.stat().st_mtime > cutoff:
            kept += 1
            continue
        path.unlink()
        removed += 1
    print(f"✓ Upload cleanup: {removed} orphan(s) removed, {kept} kept.")


def main() -> None:
    parser = argparse.ArgumentParser(description="RCAwards management commands.")
    sub = parser.add_subparsers(dest="command", required=True)

    for command, default_role in (("create-admin", "admin"), ("create-user", "judge")):
        p = sub.add_parser(command)
        p.add_argument("--email", required=True)
        p.add_argument("--password", required=True)
        p.add_argument("--name", default=None)
        if command == "create-user":
            p.add_argument("--role", default=default_role, choices=["admin", "judge"])
        p.set_defaults(role=default_role)

    sub.add_parser("seed-judges", help="Create the panel with unique random passwords")

    reset = sub.add_parser("reset-password", help="Rotate one user's password")
    reset.add_argument("--email", required=True)

    cleanup = sub.add_parser("cleanup-uploads", help="Delete unreferenced upload files")
    cleanup.add_argument("--min-age-hours", type=int, default=24)

    args = parser.parse_args()
    if args.command == "seed-judges":
        _seed_judges()
    elif args.command == "reset-password":
        _reset_password(args.email)
    elif args.command == "cleanup-uploads":
        _cleanup_uploads(args.min_age_hours)
    else:
        _create_user(args.email, args.password, args.role, getattr(args, "name", None))


if __name__ == "__main__":
    main()
