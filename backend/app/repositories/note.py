import uuid

from sqlalchemy import func, select, or_
from sqlalchemy.orm import selectinload

from ..models.note import Note
from ..models.tag import Tag
from .base import BaseRepository


class NoteRepository(BaseRepository[Note]):
    def __init__(self, session) -> None:
        super().__init__(session, Note)

    async def list_notes(
        self,
        skip: int = 0,
        limit: int = 20,
        tag: str | None = None,
    ) -> tuple[list[Note], int]:
        base = select(Note).options(selectinload(Note.tags))
        count_base = select(func.count()).select_from(Note)
        if tag:
            base = base.join(Note.tags).where(Tag.name == tag)
            count_base = count_base.join(Note.tags).where(Tag.name == tag)
        total = await self.session.scalar(count_base)
        result = await self.session.execute(
            base.order_by(Note.updated_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total or 0

    async def get_with_relations(self, id: uuid.UUID) -> Note | None:
        query = (
            select(Note)
            .options(selectinload(Note.tags))
            .where(Note.id == id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def search(self, query_str: str, skip: int = 0, limit: int = 100) -> tuple[list[Note], int]:
        pattern = f"%{query_str}%"
        base = select(Note).options(selectinload(Note.tags)).where(
            or_(Note.title.ilike(pattern), Note.content.ilike(pattern)),
        )
        count_query = select(Note.id).where(
            or_(Note.title.ilike(pattern), Note.content.ilike(pattern)),
        )
        total_result = await self.session.execute(count_query)
        total = len(total_result.all())
        query = base.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def sync_tags(self, note: Note, tag_ids: list[uuid.UUID]) -> Note:
        if not tag_ids:
            return note
        tags_result = await self.session.execute(
            select(Tag).where(Tag.id.in_(tag_ids)),
        )
        tags = list(tags_result.scalars().all())
        note.tags = tags
        await self.session.flush()
        return note

    async def add_tag(self, note: Note, tag_id: uuid.UUID) -> Note:
        tag = await self.session.get(Tag, tag_id)
        if tag is None:
            return note
        if tag not in note.tags:
            note.tags.append(tag)
            await self.session.flush()
        return note

    async def remove_tag(self, note: Note, tag_id: uuid.UUID) -> bool:
        tag = await self.session.get(Tag, tag_id)
        if tag is None or tag not in note.tags:
            return False
        note.tags.remove(tag)
        await self.session.flush()
        return True

    async def find_by_source_path(self, source_path: str) -> Note | None:
        query = select(Note).where(Note.source_path == source_path)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
