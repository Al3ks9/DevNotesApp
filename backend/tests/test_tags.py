import pytest
from httpx import AsyncClient


async def test_create_tag(client: AsyncClient):
    r = await client.post("/tags", json={"name": "python"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "python"
    assert "id" in data


async def test_create_tag_dedup(client: AsyncClient):
    await client.post("/tags", json={"name": "dedup-tag"})
    r = await client.post("/tags", json={"name": "dedup-tag"})
    assert r.status_code == 201
    assert r.json()["name"] == "dedup-tag"


async def test_list_tags_returns_paginated(client: AsyncClient):
    await client.post("/tags", json={"name": "tag-a"})
    await client.post("/tags", json={"name": "tag-b"})
    r = await client.get("/tags")
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)


async def test_list_tags_per_page(client: AsyncClient):
    for i in range(5):
        await client.post("/tags", json={"name": f"paged-tag-{i}"})
    r = await client.get("/tags?per_page=2")
    assert r.status_code == 200
    body = r.json()
    assert len(body["items"]) <= 2
    assert body["per_page"] == 2
