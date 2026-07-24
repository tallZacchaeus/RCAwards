"""add ticket check-in columns

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-07-24 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tickets",
        sa.Column("checked_in", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "tickets",
        sa.Column("checked_in_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tickets", "checked_in_at")
    op.drop_column("tickets", "checked_in")
