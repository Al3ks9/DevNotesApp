from sqlalchemy import select

from ..models.tag import Tag
from .base import BaseRepository


class TagRepository(BaseRepository[Tag]):
    def __init__(self, session) -> None:
        super().__init__(session, Tag)

    async def get_by_name(self, name: str) -> Tag | None:
        query = select(Tag).where(Tag.name == name)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
