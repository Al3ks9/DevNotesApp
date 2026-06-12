import os

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/devnotes_test",
)
# Must be set before any app module is imported.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# Patch the app engine to use NullPool so connections are never pooled.
# This eliminates all "Future attached to a different loop" issues that
# arise when asyncpg pool connections are reused across pytest event loops.
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import app.database as _db_module

_db_module.engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
_db_module.async_session_factory = async_sessionmaker(
    _db_module.engine, class_=AsyncSession, expire_on_commit=False
)

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text

from app.main import app
from app.models.base import Base

_engine = _db_module.engine
_TABLES = ["note_tags", "notes", "tags"]


@pytest.fixture(scope="session", autouse=True)
async def create_tables():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clean_db(create_tables):
    async with _engine.begin() as conn:
        for table in _TABLES:
            await conn.execute(text(f"TRUNCATE {table} CASCADE"))


@pytest_asyncio.fixture
async def client(clean_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
