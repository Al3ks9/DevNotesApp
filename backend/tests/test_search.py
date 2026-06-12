import pytest
from httpx import AsyncClient


async def test_search_by_title(client: AsyncClient):
    await client.post("/notes", json={"title": "Unique Search Target", "content": "irrelevant", "note_type": "note"})
    r = await client.get("/search?q=Unique+Search+Target")
    assert r.status_code == 200
    items = r.json()["items"]
    assert any("Unique Search Target" in n["title"] for n in items)


async def test_search_by_content(client: AsyncClient):
    await client.post("/notes", json={"title": "Any Title", "content": "content-needle-xyz", "note_type": "note"})
    r = await client.get("/search?q=content-needle-xyz")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1


async def test_search_no_results(client: AsyncClient):
    r = await client.get("/search?q=zzz-no-match-xyz-abc")
    assert r.status_code == 200
    assert r.json()["items"] == []
    assert r.json()["total"] == 0


async def test_search_requires_query(client: AsyncClient):
    r = await client.get("/search")
    assert r.status_code == 422


async def test_search_pagination(client: AsyncClient):
    for i in range(5):
        await client.post("/notes", json={"title": f"Paged Search {i}", "content": "paged-search-kw", "note_type": "note"})
    r = await client.get("/search?q=paged-search-kw&per_page=2")
    assert r.status_code == 200
    body = r.json()
    assert len(body["items"]) <= 2
    assert body["total"] >= 5
