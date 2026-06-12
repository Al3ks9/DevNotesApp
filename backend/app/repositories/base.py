import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, session: AsyncSession, model: type[ModelT]) -> None:
        self.session = session
        self.model = model

    async def get(self, id: uuid.UUID) -> ModelT | None:
        return await self.session.get(self.model, id)

    async def list(
        self, skip: int = 0, limit: int = 100, **filters: Any,
    ) -> tuple[list[ModelT], int]:
        query = select(self.model)
        for attr, value in filters.items():
            if value is not None:
                column = getattr(self.model, attr, None)
                if column is not None:
                    query = query.where(column == value)
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total or 0

    async def create(self, **kwargs: Any) -> ModelT:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def update(self, id: uuid.UUID, **kwargs: Any) -> ModelT | None:
        instance = await self.get(id)
        if instance is None:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        await self.session.flush()
        return instance

    async def delete(self, id: uuid.UUID) -> bool:
        instance = await self.get(id)
        if instance is None:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True
