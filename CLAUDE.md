# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevNotes is a personal knowledge management system (notes app for developers). The backend is a FastAPI + async SQLAlchemy service. A React/TypeScript frontend is planned but not yet created.

## Commands

All backend commands run from `backend/`. The venv is at `.venv/` in the project root.

```bash
# Activate venv (from project root)
source .venv/bin/activate

# Install/sync dependencies
pip install -e .

# Run the dev server
cd backend && uvicorn app.main:app --reload

# Migrations
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "description"
cd backend && alembic downgrade -1
```

No tests, linter, or type-checker are configured yet.

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
```

Request flow: **Router → Service → Repository → SQLAlchemy → PostgreSQL**

- Session injected via `Depends(get_db)` from `app/api/deps.py`.
- Business logic must live in services only — not in routers or repositories.
- All internal imports use relative imports (`from .xxx`, `from ..xxx`).

## Database Conventions

- All PKs are UUID (`default=uuid.uuid4` — Python-side, not `server_default`).
- Timestamps use `DateTime(timezone=True)` with `server_default=func.now()`; `updated_at` uses `onupdate=func.now()`.
- Constraint naming convention defined in `app/models/base.py` (prefixes: `ix_`, `uq_`, `fk_`, `pk_`).
- `greenlet` is a required dependency — SQLAlchemy async + asyncpg will raise `ValueError` without it.
- `DATABASE_URL` env var loaded via python-dotenv from `.env`; default: `postgresql+asyncpg://postgres:postgres@localhost:5432/devnotes`.

## Schema Conventions

- Pydantic v2, per-operation pattern: `NoteCreate`, `NoteUpdate`, `NoteRead`, `NoteList`.
- All schemas set `model_config = ConfigDict(from_attributes=True)` for ORM mode.
- Pagination returns `PaginatedResponse[T]` with `items`, `total`, `page`, `per_page`; query params `?page=1&per_page=20` (max 100).

## Active Refactor (specs/devnotes_backend_refactor_spec.md)

The `projects` feature is being removed. Notes are organized by tags and search only. See the spec for the full list of files to delete and modify, plus the required new Alembic migration. Key changes:
- Drop `projects` table and `notes.project_id` column via a new migration (do not touch `0001_initial_schema.py`).
- `ImportFolderRequest` gains `tags: list[str] = []` replacing `project_id`.
- Import service resolves tag names to `Tag` rows (creating if missing) before the file loop, then applies them to every imported note.

## Frontend Plan (specs/devnotes_ui_spec.md)

React + TypeScript, CSS Modules, no UI framework. Three-column layout (sidebar 260px / main / floating right panel). Editor uses TipTap headless with custom toolbar. Plain text notes use `<textarea>`. All colors and typography defined in a single `variables.css`. See the spec for keyboard shortcuts, page-by-page layout details, and reusable component list (`TagChip`, `TagPicker`, `NoteCard`, `Modal`).

## Gotchas

- Do not name methods `list` inside class bodies — it shadows the builtin and breaks `list[...]` annotations.
- Import all models in `alembic/env.py` via `from app.models import *` so Alembic can detect schema changes.
- `Ctrl+B` is both a global sidebar shortcut and a TipTap bold shortcut — the sidebar handler must check `editor.isFocused` before firing.
