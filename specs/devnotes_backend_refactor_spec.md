# DevNotes — Backend Refactor: Remove Projects, Add Tag-on-Import

## Summary

The `projects` feature is being removed entirely from the backend. Notes will be organized solely by tags and full-text search. The import endpoint is being updated to accept optional tags at import time, so users can bulk-tag notes during the import process.

---

## Part 1: Remove Projects

### What Projects Were

A `Project` was a first-class organizational entity with a one-to-many relationship to `Note` (via a nullable `project_id` FK on the notes table). The import endpoint required a `project_id`. Nothing else in the system depended on projects.

### Why They Are Being Removed

Projects add friction — every new note would require assigning a project. The target workflow is: open the app, write, tag as needed. Tags alone are sufficient for organization.

### Database Changes Required

1. Drop the foreign key constraint `notes_project_id_fkey` from the `notes` table
2. Drop the `project_id` column from the `notes` table
3. Drop the `projects` table entirely
4. Drop any index on `projects.name` if it exists

These changes must be expressed as a new Alembic migration. The existing initial migration (`0001_initial_schema.py`) must not be rewritten — a new migration file must be created that performs these drops in the correct dependency order (FK first, then column, then table).

The `downgrade()` function of this new migration must reverse all changes cleanly.

---

### Files to Remove Entirely

- `backend/app/models/project.py`
- `backend/app/schemas/project.py`
- `backend/app/repositories/project.py`
- `backend/app/services/project.py`
- `backend/app/api/projects.py`

---

### Files to Modify

#### `backend/app/models/note.py`
- Remove `project_id` column definition
- Remove the `project` relationship
- Remove any index defined on `project_id`

#### `backend/app/models/__init__.py`
- Remove `Project` from exports

#### `backend/app/schemas/note.py`
- Remove `project_id` field from `NoteCreate`, `NoteUpdate`, `NoteRead`, and `NoteList` schemas

#### `backend/app/schemas/common.py`
- Remove `project_id` from `ImportFolderRequest`

#### `backend/app/schemas/__init__.py`
- Remove all `Project*` schema imports

#### `backend/app/repositories/note.py`
- Remove any `project_id` parameter from `create` and `update` methods if present

#### `backend/app/services/note.py`
- Remove `project_id` parameter from `create` and `update` method signatures

#### `backend/app/services/importer.py`
- Remove `project_id` parameter from `import_folder` method signature and all internal usage

#### `backend/app/api/notes.py`
- Remove `project_id` as a query parameter from `GET /notes`
- Remove `project_id` from note create and update request handling

#### `backend/app/api/imports.py`
- Remove `project_id` from the import endpoint schema dependency (see Part 2 for what replaces it)

#### `backend/app/api/deps.py`
- Remove `get_project_repo` and `get_project_service` dependency functions

#### `backend/app/main.py`
- Remove `projects_router` import
- Remove `app.include_router(projects_router, ...)` call

---

## Part 2: Add Tag Assignment to Import

### What Changes

The import endpoint currently accepts a `project_id`. After the project removal, this field is dropped. In its place, the import endpoint will accept an optional list of tag names. All notes created by a single import operation will have these tags applied.

### Schema Change

`ImportFolderRequest` (in `backend/app/schemas/common.py`) changes from:

```
folder_path: str
project_id: int  ← remove
```

to:

```
folder_path: str
tags: list[str] = []   ← add (list of tag name strings, optional, defaults to empty)
```

Tag names are passed as plain strings. The import service is responsible for resolving them to `Tag` model instances (creating new tags if they do not already exist) before associating them with the created notes.

### Import Service Changes (`backend/app/services/importer.py`)

The `import_folder` method signature changes from:

```python
async def import_folder(folder_path: str, project_id: int) -> ImportResult
```

to:

```python
async def import_folder(folder_path: str, tags: list[str] = []) -> ImportResult
```

Internal logic changes:
1. Remove all `project_id` handling
2. After the list of tag name strings is received, resolve each tag name:
   - If a tag with that name already exists in the database, retrieve it
   - If it does not exist, create it
3. After each note is created from an imported file, associate all resolved tags with that note via the `note_tags` junction table
4. If `tags` is empty, notes are created with no tags — this is valid behavior

Tag resolution should be performed once before the file loop begins, not once per file, to avoid redundant queries.

### Import API Endpoint Changes (`backend/app/api/imports.py`)

- Accept the updated `ImportFolderRequest` schema (with `tags: list[str]`)
- Pass the `tags` list through to the import service
- Response schema remains unchanged (imported count, skipped count, error count)

---

## Part 3: New Alembic Migration

A new migration file must be created (do not modify `0001_initial_schema.py`).

The migration must perform the following in `upgrade()`:
1. Drop the foreign key constraint on `notes.project_id`
2. Drop the `project_id` column from `notes`
3. Drop the `projects` table
4. Drop any associated indexes on the `projects` table

The `downgrade()` must reverse these steps in the correct order:
1. Recreate the `projects` table with its original schema
2. Add the `project_id` column back to `notes`
3. Recreate the foreign key constraint

---

## Part 4: Verification Checklist

After completing the refactor, the following must hold:

- `GET /notes` no longer accepts or returns a `project_id` field
- `POST /notes` and `PUT /notes/:id` no longer accept `project_id`
- `POST /import-folder` accepts `folder_path` and optional `tags: list[str]`
- Importing a folder with tags applies those tags to every imported note
- Importing a folder with no tags creates notes with no tags (not an error)
- The `projects` table no longer exists in the database after running migrations
- No orphaned references to `Project` remain in models, schemas, services, or routers
- Existing tag functionality (add/remove tags on individual notes) is unaffected
- Search functionality is unaffected
- Alembic `alembic upgrade head` runs cleanly from a fresh database
- Alembic `alembic downgrade -1` correctly restores the projects table and `project_id` column