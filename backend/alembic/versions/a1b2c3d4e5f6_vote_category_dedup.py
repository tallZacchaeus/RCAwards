"""denormalize category_id onto votes for per-category vote dedup

Adds votes.category_id (backfilled from the nominee) plus an index and a
UniqueConstraint(category_id, voter_fingerprint) so the one-vote-per-category
rule is enforced by the database rather than a race-prone check-then-insert.

Revision ID: a1b2c3d4e5f6
Revises: 396bad650aa6
Create Date: 2026-07-04 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "396bad650aa6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the column nullable so existing rows can be backfilled.
    op.add_column("votes", sa.Column("category_id", sa.Integer(), nullable=True))

    # 2. Backfill from the linked nominee (works on both SQLite and MySQL/MariaDB).
    op.execute(
        "UPDATE votes SET category_id = "
        "(SELECT nominees.category_id FROM nominees WHERE nominees.id = votes.nominee_id) "
        "WHERE category_id IS NULL"
    )

    # 3. Any votes still orphaned (nominee deleted) cannot be assigned a category;
    #    remove them so the NOT NULL + unique constraints can be applied cleanly.
    op.execute("DELETE FROM votes WHERE category_id IS NULL")

    # 4. Lock it down. batch_alter_table keeps this portable to SQLite.
    with op.batch_alter_table("votes", schema=None) as batch_op:
        batch_op.alter_column("category_id", existing_type=sa.Integer(), nullable=False)
        batch_op.create_index("ix_votes_category_id", ["category_id"])
        batch_op.create_index("ix_votes_ip_hash", ["ip_hash"])
        batch_op.create_foreign_key(
            "fk_votes_category_id_categories", "categories", ["category_id"], ["id"]
        )
        batch_op.create_unique_constraint(
            "uq_vote_once_per_category", ["category_id", "voter_fingerprint"]
        )


def downgrade() -> None:
    with op.batch_alter_table("votes", schema=None) as batch_op:
        batch_op.drop_constraint("uq_vote_once_per_category", type_="unique")
        batch_op.drop_constraint("fk_votes_category_id_categories", type_="foreignkey")
        batch_op.drop_index("ix_votes_ip_hash")
        batch_op.drop_index("ix_votes_category_id")
        batch_op.drop_column("category_id")
