import uuid

from ..repositories.note import NoteRepository
from ..schemas.note import NoteCreate, NoteUpdate


class NoteService:
    def __init__(self, repo: NoteRepository) -> None:
        self.repo = repo

    async def get(self, id: uuid.UUID):
        return await self.repo.get_with_relations(id)

    async def list(self, skip: int = 0, limit: int = 20, tag: str | None = None):
        return await self.repo.list_notes(skip=skip, limit=limit, tag=tag)

    async def create(self, data: NoteCreate):
        note = await self.repo.create(
            title=data.title,
            content=data.content,
            source_path=data.source_path,
            note_type=data.note_type,
        )
        if data.tag_ids:
            await self.repo.sync_tags(note, data.tag_ids)
        # Reload with eagerly-fetched tags so Pydantic can serialize NoteRead.
        return await self.repo.get_with_relations(note.id)

    async def update(self, id: uuid.UUID, data: NoteUpdate):
        note = await self.repo.update(
            id,
            title=data.title,
            content=data.content,
            source_path=data.source_path,
            note_type=data.note_type,
        )
        if note is None:
            return None
        if data.tag_ids is not None:
            await self.repo.sync_tags(note, data.tag_ids)
        # Reload with eagerly-fetched tags so Pydantic can serialize NoteRead.
        return await self.repo.get_with_relations(note.id)

    async def delete(self, id: uuid.UUID) -> bool:
        return await self.repo.delete(id)
