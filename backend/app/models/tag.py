import uuid

from sqlalchemy import Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    notes: Mapped[list["Note"]] = relationship(
        secondary="note_tags",
        back_populates="tags",
    )

    __table_args__ = (
        Index("ix_tags_name", "name"),
    )
