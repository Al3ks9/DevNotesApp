from ..repositories.note import NoteRepository


class SearchService:
    def __init__(self, repo: NoteRepository) -> None:
        self.repo = repo

    async def search(self, query: str, skip: int = 0, limit: int = 100):
        return await self.repo.search(query, skip=skip, limit=limit)
