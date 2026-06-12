import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.imports import router as imports_router
from app.api.notes import router as notes_router
from app.api.search import router as search_router
from app.api.tags import router as tags_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.db import init_db, teardown_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting DevNotes API")
    await init_db()
    yield
    await teardown_db()
    logger.info("Shutdown complete")


app = FastAPI(
    title="DevNotes API",
    description="Personal knowledge management system",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(notes_router)
app.include_router(tags_router)
app.include_router(search_router)
app.include_router(imports_router)
