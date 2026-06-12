from fastapi import APIRouter, Depends, Query

from .deps import get_tag_service
from ..schemas.common import PaginatedResponse
from ..schemas.tag import TagCreate, TagRead
from ..services.tag import TagService

router = APIRouter(tags=["tags"])


@router.get("/tags", response_model=PaginatedResponse[TagRead])
async def list_tags(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service: TagService = Depends(get_tag_service),
):
    items = await service.list_all()
    skip = (page - 1) * per_page
    return PaginatedResponse(
        items=items[skip : skip + per_page],
        total=len(items),
        page=page,
        per_page=per_page,
    )


@router.post("/tags", response_model=TagRead, status_code=201)
async def create_tag(data: TagCreate, service: TagService = Depends(get_tag_service)):
    return await service.create(data)
