"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-06-09
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), unique=True, nullable=False),
    )
    op.create_index("ix_tags_name", "tags", ["name"])

    op.create_table(
        "notes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source_path", sa.Text(), nullable=True),
        sa.Column(
            "note_type",
            sa.Enum("note", "snippet", "document", name="notetype"),
            nullable=False,
            server_default="note",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_notes_title", "notes", ["title"])
    op.create_index("ix_notes_source_path", "notes", ["source_path"])

    op.create_table(
        "note_tags",
        sa.Column(
            "note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("note_tags")
    op.drop_table("notes")
    op.drop_table("tags")
    op.execute("DROP TYPE IF EXISTS notetype")
