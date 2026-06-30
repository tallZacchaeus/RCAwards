"""Small management CLI for operational tasks.

Usage:
    python -m app.manage create-admin --email you@example.com --password 'secret123'
    python -m app.manage create-user  --email judge@example.com --password 'secret123' --role judge
    python -m app.manage seed-judges   --password 'temp-pass-1234'
"""
from __future__ import annotations

import argparse
import re
import sys

from sqlalchemy import select

from .db import SessionLocal
from .models import User, UserRole
from .security import hash_password

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


def _seed_judges(password: str) -> None:
    if len(password) < 8:
        sys.exit("Password must be at least 8 characters.")
    session = SessionLocal()
    created = skipped = 0
    try:
        for name in JUDGE_PANEL:
            email = _slug_email(name)
            if session.scalar(select(User).where(User.email == email)):
                skipped += 1
                continue
            session.add(
                User(email=email, name=name, password_hash=hash_password(password), role=UserRole.judge)
            )
            created += 1
        session.commit()
        print(f"✓ Seeded judge panel: {created} created, {skipped} already existed.")
        print("  Emails are @judges.rcawards.local placeholders — update before go-live.")
    finally:
        session.close()


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

    seed = sub.add_parser("seed-judges")
    seed.add_argument("--password", required=True, help="Shared temporary password for the panel")

    args = parser.parse_args()
    if args.command == "seed-judges":
        _seed_judges(args.password)
    else:
        _create_user(args.email, args.password, args.role, getattr(args, "name", None))


if __name__ == "__main__":
    main()
