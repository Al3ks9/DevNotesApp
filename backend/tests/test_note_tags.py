import pytest
from httpx import AsyncClient


async def _create_note(client: AsyncClient, title="Note"):
    r = await client.post("/notes", json={"title": title, "content": "body", "note_type": "note"})
    assert r.status_code == 201
    return r.json()


async def _create_tag(client: AsyncClient, name="tag"):
    r = await client.post("/tags", json={"name": name})
    assert r.status_code == 201
    return r.json()


async def test_add_tag_to_note(client: AsyncClient):
    note = await _create_note(client, "Tagged Note")
    tag = await _create_tag(client, "my-tag")
    r = await client.post(f"/notes/{note['id']}/tags", json={"tag_ids": [tag["id"]]})
    assert r.status_code == 200
    data = r.json()
    assert any(t["id"] == tag["id"] for t in data["tags"])


async def test_remove_tag_from_note(client: AsyncClient):
    note = await _create_note(client, "Tagged for Removal")
    tag = await _create_tag(client, "removable-tag")
    await client.post(f"/notes/{note['id']}/tags", json={"tag_ids": [tag["id"]]})

    r = await client.delete(f"/notes/{note['id']}/tags/{tag['id']}")
    assert r.status_code == 204

    r = await client.get(f"/notes/{note['id']}")
    assert not any(t["id"] == tag["id"] for t in r.json()["tags"])


async def test_add_tag_note_not_found(client: AsyncClient):
    tag = await _create_tag(client, "orphan-tag")
    r = await client.post(
        "/notes/00000000-0000-0000-0000-000000000000/tags",
        json={"tag_ids": [tag["id"]]},
    )
    assert r.status_code == 404


async def test_add_multiple_tags(client: AsyncClient):
    note = await _create_note(client, "Multi-tag Note")
    tag1 = await _create_tag(client, "multi-a")
    tag2 = await _create_tag(client, "multi-b")
    r = await client.post(f"/notes/{note['id']}/tags", json={"tag_ids": [tag1["id"], tag2["id"]]})
    assert r.status_code == 200
    tag_ids = {t["id"] for t in r.json()["tags"]}
    assert tag1["id"] in tag_ids
    assert tag2["id"] in tag_ids
