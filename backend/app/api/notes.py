import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from .deps import get_note_service, get_tag_service
from ..schemas.common import PaginatedResponse, TagNoteRequest
from ..schemas.note import NoteCreate, NoteList, NoteRead, NoteUpdate
from ..services.note import NoteService
from ..services.tag import TagService

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=PaginatedResponse[NoteList])
async def list_notes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service: NoteService = Depends(get_note_service),
):
    skip = (page - 1) * per_page
    items, total = await service.list(skip=skip, limit=per_page)
    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page)


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(note_id: uuid.UUID, service: NoteService = Depends(get_note_service)):
    note = await service.get(note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("", response_model=NoteRead, status_code=201)
async def create_note(data: NoteCreate, service: NoteService = Depends(get_note_service)):
    return await service.create(data)


@router.put("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: uuid.UUID,
    data: NoteUpdate,
    service: NoteService = Depends(get_note_service),
):
    note = await service.update(note_id, data)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: uuid.UUID, service: NoteService = Depends(get_note_service)):
    deleted = await service.delete(note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")


@router.post("/{note_id}/tags", response_model=NoteRead)
async def add_tags(
    note_id: uuid.UUID,
    data: TagNoteRequest,
    tag_service: TagService = Depends(get_tag_service),
):
    note = None
    for tag_id in data.tag_ids:
        note = await tag_service.add_to_note(note_id, tag_id)
        if note is None:
            raise HTTPException(status_code=404, detail="Note not found")
    if note is None:
        note = await tag_service.note_repo.get_with_relations(note_id)
        if note is None:
            raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}/tags/{tag_id}", status_code=204)
async def remove_tag(
    note_id: uuid.UUID,
    tag_id: uuid.UUID,
    tag_service: TagService = Depends(get_tag_service),
):
    removed = await tag_service.remove_from_note(note_id, tag_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Note or tag not found")
