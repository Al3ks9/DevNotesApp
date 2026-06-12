import logging
from pathlib import Path

from ..enums import NoteType
from ..models.note import Note
from ..models.note_tag import NoteTags
from ..models.tag import Tag
from ..repositories.note import NoteRepository

logger = logging.getLogger(__name__)

EXTENSIONS = {".md", ".txt"}


class ImportService:
    def __init__(self, repo: NoteRepository) -> None:
        self.repo = repo

    async def import_folder(self, path: str, tags: list[str] = []) -> dict:
        from sqlalchemy import select
        from sqlalchemy.ext.asyncio import AsyncSession

        root = Path(path).expanduser().resolve()
        if not root.is_dir():
            return {"created": 0, "skipped": 0, "errors": [f"Path not found: {path}"]}

        session: AsyncSession = self.repo.session
        resolved_tags = []
        for tag_name in tags:
            result = await session.execute(select(Tag).where(Tag.name == tag_name))
            tag = result.scalar_one_or_none()
            if tag is None:
                tag = Tag(name=tag_name)
                session.add(tag)
                await session.flush()
            resolved_tags.append(tag)

        created = 0
        skipped = 0
        errors: list[str] = []

        for file_path in sorted(root.rglob("*")):
            if file_path.suffix.lower() not in EXTENSIONS or not file_path.is_file():
                continue
            try:
                source = str(file_path)
                existing = await self.repo.find_by_source_path(source)
                if existing is not None:
                    skipped += 1
                    continue

                content = file_path.read_text(encoding="utf-8", errors="replace")
                title = file_path.stem
                note = await self.repo.create(
                    title=title,
                    content=content,
                    source_path=source,
                    note_type=NoteType.document,
                )
                if resolved_tags:
                    # Reload with selectinload so note.tags is initialised
                    # before assignment; direct set on an unloaded async
                    # relationship triggers MissingGreenlet.
                    note = await self.repo.get_with_relations(note.id)
                    note.tags = resolved_tags
                    await session.flush()
                created += 1
            except Exception as exc:
                logger.warning("Failed to import %s: %s", file_path, exc)
                errors.append(f"{file_path}: {exc}")

        return {"created": created, "skipped": skipped, "errors": errors}
