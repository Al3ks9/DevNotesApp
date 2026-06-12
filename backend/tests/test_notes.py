import pytest
from httpx import AsyncClient


async def _create_note(client: AsyncClient, title="Test Note", content="Some content", note_type="note"):
    r = await client.post("/notes", json={"title": title, "content": content, "note_type": note_type})
    assert r.status_code == 201
    return r.json()


async def test_create_note(client: AsyncClient):
    r = await client.post("/notes", json={"title": "Hello", "content": "World", "note_type": "note"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Hello"
    assert data["content"] == "World"
    assert data["note_type"] == "note"
    assert data["tags"] == []
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


async def test_create_snippet(client: AsyncClient):
    r = await client.post("/notes", json={"title": "Snip", "content": "code here", "note_type": "snippet"})
    assert r.status_code == 201
    assert r.json()["note_type"] == "snippet"


async def test_get_note(client: AsyncClient):
    note = await _create_note(client, title="Get Me")
    r = await client.get(f"/notes/{note['id']}")
    assert r.status_code == 200
    assert r.json()["title"] == "Get Me"


async def test_get_note_not_found(client: AsyncClient):
    r = await client.get("/notes/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


async def test_update_note(client: AsyncClient):
    note = await _create_note(client, title="Original")
    r = await client.put(f"/notes/{note['id']}", json={"title": "Updated"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated"
    assert r.json()["content"] == "Some content"


async def test_delete_note(client: AsyncClient):
    note = await _create_note(client, title="Delete Me")
    r = await client.delete(f"/notes/{note['id']}")
    assert r.status_code == 204
    r = await client.get(f"/notes/{note['id']}")
    assert r.status_code == 404


async def test_list_notes_returns_paginated(client: AsyncClient):
    for i in range(3):
        await _create_note(client, title=f"List Note {i}")
    r = await client.get("/notes")
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)
    for item in body["items"]:
        assert "tags" in item


async def test_list_notes_pagination(client: AsyncClient):
    for i in range(5):
        await _create_note(client, title=f"Paged {i}")
    r = await client.get("/notes?per_page=2&page=1")
    assert r.status_code == 200
    body = r.json()
    assert len(body["items"]) <= 2
    assert body["per_page"] == 2


async def test_list_notes_tag_filter(client: AsyncClient):
    tag_r = await client.post("/tags", json={"name": "filter-tag"})
    tag_id = tag_r.json()["id"]

    note_with = await _create_note(client, title="Has Tag")
    await client.post(f"/notes/{note_with['id']}/tags", json={"tag_ids": [tag_id]})

    await _create_note(client, title="No Tag")

    r = await client.get("/notes?tag=filter-tag")
    assert r.status_code == 200
    items = r.json()["items"]
    assert all(any(t["name"] == "filter-tag" for t in n["tags"]) for n in items)
    assert len(items) >= 1
