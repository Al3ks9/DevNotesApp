import uuid

from fastapi import APIRouter, Depends, HTTPException

from .deps import get_tag_service
from ..schemas.common import TagNoteRequest
from ..schemas.note import NoteRead
from ..schemas.tag import TagCreate, TagRead
from ..services.tag import TagService

router = APIRouter(tags=["tags"])


@router.get("/tags", response_model=list[TagRead])
async def list_tags(service: TagService = Depends(get_tag_service)):
    return await service.list_all()


@router.post("/tags", response_model=TagRead, status_code=201)
async def create_tag(data: TagCreate, service: TagService = Depends(get_tag_service)):
    return await service.create(data)


@router.post("/notes/{note_id}/tags", response_model=NoteRead)
async def add_tags_to_note(
    note_id: uuid.UUID,
    data: TagNoteRequest,
    service: TagService = Depends(get_tag_service),
):
    note = await service.sync_note_tags(note_id, data.tag_ids)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/notes/{note_id}/tags/{tag_id}", status_code=204)
async def remove_tag_from_note(
    note_id: uuid.UUID,
    tag_id: uuid.UUID,
    service: TagService = Depends(get_tag_service),
):
    removed = await service.remove_from_note(note_id, tag_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Note or tag not found")
