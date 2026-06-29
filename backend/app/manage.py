"""Small management CLI for operational tasks.

Usage:
    python -m app.manage create-admin --email you@example.com --password 'secret123'
    python -m app.manage create-user  --email judge@example.com --password 'secret123' --role judge
"""
from __future__ import annotations

import argparse
import sys

from sqlalchemy import select

from .db import SessionLocal
from .models import User, UserRole
from .security import hash_password


def _create_user(email: str, password: str, role: str) -> None:
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
        session.add(User(email=email, password_hash=hash_password(password), role=user_role))
        session.commit()
        print(f"✓ Created {user_role.value}: {email}")
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="RCAwards management commands.")
    sub = parser.add_subparsers(dest="command", required=True)

    for command, default_role in (("create-admin", "admin"), ("create-user", "judge")):
        p = sub.add_parser(command)
        p.add_argument("--email", required=True)
        p.add_argument("--password", required=True)
        if command == "create-user":
            p.add_argument("--role", default=default_role, choices=["admin", "judge"])
        p.set_defaults(role=default_role)

    args = parser.parse_args()
    _create_user(args.email, args.password, args.role)


if __name__ == "__main__":
    main()
