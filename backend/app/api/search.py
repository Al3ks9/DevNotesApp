from fastapi import APIRouter, Depends, Query

from .deps import get_search_service
from ..schemas.common import PaginatedResponse
from ..schemas.note import NoteList
from ..services.search import SearchService

router = APIRouter(tags=["search"])


@router.get("/search", response_model=PaginatedResponse[NoteList])
async def search_notes(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service: SearchService = Depends(get_search_service),
):
    skip = (page - 1) * per_page
    items, total = await service.search(q, skip=skip, limit=per_page)
    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page)
