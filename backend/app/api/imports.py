from fastapi import APIRouter, Depends

from .deps import get_import_service
from ..schemas.common import ImportFolderRequest, ImportResult
from ..services.importer import ImportService

router = APIRouter(tags=["imports"])


@router.post("/import-folder", response_model=ImportResult)
async def import_folder(
    data: ImportFolderRequest,
    service: ImportService = Depends(get_import_service),
):
    return await service.import_folder(data.path, data.tags)
