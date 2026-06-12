from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..repositories.note import NoteRepository
from ..repositories.tag import TagRepository
from ..services.importer import ImportService
from ..services.note import NoteService
from ..services.search import SearchService
from ..services.tag import TagService


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


def get_note_repo(session: AsyncSession = Depends(get_session)) -> NoteRepository:
    return NoteRepository(session)


def get_tag_repo(session: AsyncSession = Depends(get_session)) -> TagRepository:
    return TagRepository(session)


def get_note_service(repo: NoteRepository = Depends(get_note_repo)) -> NoteService:
    return NoteService(repo)


def get_tag_service(
    repo: TagRepository = Depends(get_tag_repo),
    note_repo: NoteRepository = Depends(get_note_repo),
) -> TagService:
    return TagService(repo, note_repo)


def get_search_service(repo: NoteRepository = Depends(get_note_repo)) -> SearchService:
    return SearchService(repo)


def get_import_service(repo: NoteRepository = Depends(get_note_repo)) -> ImportService:
    return ImportService(repo)
