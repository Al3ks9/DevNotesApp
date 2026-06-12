import tempfile
from pathlib import Path
import pytest
from httpx import AsyncClient


async def test_import_nonexistent_folder(client: AsyncClient):
    r = await client.post("/import-folder", json={"path": "/nonexistent/path/xyz", "tags": []})
    assert r.status_code == 200
    data = r.json()
    assert data["created"] == 0
    assert len(data["errors"]) > 0


async def test_import_folder_creates_notes(client: AsyncClient):
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, "note1.md").write_text("# Hello\nThis is a markdown note.")
        Path(tmpdir, "note2.txt").write_text("Plain text note.")
        Path(tmpdir, "ignored.py").write_text("print('ignored')")

        r = await client.post("/import-folder", json={"path": tmpdir, "tags": []})
        assert r.status_code == 200
        data = r.json()
        assert data["created"] == 2
        assert data["skipped"] == 0
        assert data["errors"] == []


async def test_import_skips_already_imported(client: AsyncClient):
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, "once.md").write_text("Import me once.")
        await client.post("/import-folder", json={"path": tmpdir, "tags": []})

        r = await client.post("/import-folder", json={"path": tmpdir, "tags": []})
        assert r.status_code == 200
        data = r.json()
        assert data["created"] == 0
        assert data["skipped"] == 1


async def test_import_applies_tags(client: AsyncClient):
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, "tagged.md").write_text("Tagged note content.")
        r = await client.post("/import-folder", json={"path": tmpdir, "tags": ["import-tag"]})
        assert r.status_code == 200
        assert r.json()["created"] == 1

    r = await client.get("/notes?tag=import-tag")
    assert r.status_code == 200
    assert r.json()["total"] >= 1
