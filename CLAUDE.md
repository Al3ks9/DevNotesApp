# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ground Rules

- **Never commit to git.** The user manages all git commits and pushes manually. Do not run `git add`, `git commit`, `git push`, or any other git write command unless explicitly asked.

## Project Overview

DevNotes is a personal knowledge management system (notes app for developers). The backend is a FastAPI + async SQLAlchemy service. The frontend is a React + TypeScript SPA (Vite, CSS Modules, TipTap editor).

## Commands

All backend commands run from `backend/`. The venv is at `.venv/` in the project root.

```bash
# Activate venv (from project root)
source .venv/bin/activate

# Install dependencies (including test extras)
pip install -e ".[test]"

# Run the dev server
cd backend && uvicorn app.main:app --reload

# Run tests (requires devnotes_test DB to exist)
cd backend && pytest tests/ -v

# Migrations
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "description"
cd backend && alembic downgrade -1

# Frontend dev server
cd frontend && npm run dev

# Frontend build
cd frontend && npm run build
```

## Architecture

```
backend/app/
  api/          # FastAPI routers — thin, no business logic
  services/     # Business logic layer
  repositories/ # DB access via SQLAlchemy (BaseRepository[T] generic CRUD)
  models/       # SQLAlchemy ORM models
  schemas/      # Pydantic v2 schemas (Create/Update/Read/List per entity)
  core/         # config.py (pydantic-settings), logging.py
  db/           # init_db / teardown_db (engine lifecycle)
  main.py       # FastAPI app + lifespan + middleware

frontend/src/
  api/          # apiFetch client + typed wrappers per resource
  components/   # Layout, Sidebar, TagChip, TagPicker, Modal, NoteCard,
                #   EditorToolbar, SearchModal
  pages/        # NotesPage, NoteEditorPage, TagsPage, ImportPage
  styles/       # variables.css (design tokens), global.css
```

Request flow: **Router → Service → Repository → SQLAlchemy → PostgreSQL**

- Session injected via `Depends(get_session)` from `app/api/deps.py`.
- Business logic must live in services only — not in routers or repositories.
- All internal imports use relative imports (`from .xxx`, `from ..xxx`).

## Database Conventions

- All PKs are UUID (`default=uuid.uuid4` — Python-side, not `server_default`).
- Timestamps use `DateTime(timezone=True)` with `server_default=func.now()`; `updated_at` uses `onupdate=func.now()`.
- Constraint naming convention defined in `app/models/base.py` (prefixes: `ix_`, `uq_`, `fk_`, `pk_`).
- `greenlet` is a required dependency — SQLAlchemy async + asyncpg will raise `ValueError` without it.
- `DATABASE_URL` env var loaded via python-dotenv from `.env`; default: `postgresql+asyncpg://postgres:postgres@localhost:5432/devnotes`.
- The session commits via `async with session.begin()` inside `get_async_session` — do not call `session.commit()` manually in services/repositories.

## Schema Conventions

- Pydantic v2, per-operation pattern: `NoteCreate`, `NoteUpdate`, `NoteRead`, `NoteList`.
- All schemas set `model_config = ConfigDict(from_attributes=True)` for ORM mode.
- Pagination returns `PaginatedResponse[T]` with `items`, `total`, `page`, `per_page`; query params `?page=1&per_page=20` (max 100). All list endpoints (notes and tags) use this shape.

## Tests

Tests live in `backend/tests/`. Run with `pytest tests/ -v` from `backend/`.

- Requires a `devnotes_test` PostgreSQL database (`createdb devnotes_test`).
- Override DB with `TEST_DATABASE_URL` env var if needed.
- `conftest.py` patches the app engine to use `NullPool` and truncates all tables before each test — no manual cleanup needed in test functions.
- Fixtures: `client` (httpx `AsyncClient` against the live ASGI app) and `clean_db` (auto-use, table truncation).

## Gotchas

- Do not name methods `list` inside class bodies — it shadows the builtin and breaks `list[...]` annotations.
- Import all models in `alembic/env.py` via `from app.models import *` so Alembic can detect schema changes.
- After `repo.create()` or `repo.update()`, always call `repo.get_with_relations(id)` before returning — the plain ORM object has unloaded relationships that cause `MissingGreenlet` when Pydantic serialises them.
- Before setting `note.tags = [...]` in any service/importer, load the note via `get_with_relations` first; assigning to an unloaded async relationship triggers `MissingGreenlet`.
- `Ctrl+B` is both a global sidebar shortcut and a TipTap bold shortcut — the sidebar handler checks `editor.isFocused` before firing.
- `VITE_API_URL` must be set at build time for the frontend (baked in by Vite); defaults to `http://localhost:8000`.
