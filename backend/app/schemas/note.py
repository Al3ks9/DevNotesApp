import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from ..enums import NoteType


class NoteTagRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class NoteCreate(BaseModel):
    title: str
    content: str
    source_path: str | None = None
    note_type: NoteType = NoteType.note
    tag_ids: list[uuid.UUID] | None = None


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    source_path: str | None = None
    note_type: NoteType | None = None
    tag_ids: list[uuid.UUID] | None = None


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    source_path: str | None
    note_type: NoteType
    created_at: datetime
    updated_at: datetime
    tags: list[NoteTagRef] = []


class NoteList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    note_type: NoteType
    created_at: datetime
    updated_at: datetime
    tags: list[NoteTagRef] = []
