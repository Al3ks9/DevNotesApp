import uuid
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int


class ImportFolderRequest(BaseModel):
    path: str
    tags: list[str] = []


class ImportResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


class TagNoteRequest(BaseModel):
    tag_ids: list[uuid.UUID]
