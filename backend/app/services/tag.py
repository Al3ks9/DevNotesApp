import uuid

from ..repositories.note import NoteRepository
from ..repositories.tag import TagRepository
from ..schemas.tag import TagCreate


class TagService:
    def __init__(self, repo: TagRepository, note_repo: NoteRepository) -> None:
        self.repo = repo
        self.note_repo = note_repo

    async def list_all(self):
        items, _ = await self.repo.list(skip=0, limit=10000)
        return items

    async def create(self, data: TagCreate):
        existing = await self.repo.get_by_name(data.name)
        if existing:
            return existing
        return await self.repo.create(name=data.name)

    async def add_to_note(self, note_id: uuid.UUID, tag_id: uuid.UUID):
        note = await self.note_repo.get_with_relations(note_id)
        if note is None:
            return None
        return await self.note_repo.add_tag(note, tag_id)

    async def remove_from_note(self, note_id: uuid.UUID, tag_id: uuid.UUID) -> bool:
        note = await self.note_repo.get_with_relations(note_id)
        if note is None:
            return False
        return await self.note_repo.remove_tag(note, tag_id)

    async def sync_note_tags(self, note_id: uuid.UUID, tag_ids: list[uuid.UUID]):
        note = await self.note_repo.get_with_relations(note_id)
        if note is None:
            return None
        return await self.note_repo.sync_tags(note, tag_ids)
