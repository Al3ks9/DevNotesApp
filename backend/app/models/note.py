import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Index, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..enums import NoteType
from .base import Base


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    note_type: Mapped[NoteType] = mapped_column(
        Enum(NoteType, name="notetype", create_constraint=True),
        nullable=False,
        default=NoteType.note,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    tags: Mapped[list["Tag"]] = relationship(
        secondary="note_tags",
        back_populates="notes",
    )

    __table_args__ = (
        Index("ix_notes_title", "title"),
        Index("ix_notes_source_path", "source_path"),
    )
