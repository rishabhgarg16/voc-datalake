from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import get_pool, close_pool
from app.api import brands, overview, funnel, attribution, voc, segments, products, interventions, sessions, ask


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Don't connect to DB on startup — connect lazily on first request
    # This prevents the app from crashing if DB is temporarily unavailable
    yield
    await close_pool()


app = FastAPI(title="VoC Datalake API", version="1.0.4", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brands.router, prefix="/api")
app.include_router(overview.router, prefix="/api")
app.include_router(funnel.router, prefix="/api")
app.include_router(attribution.router, prefix="/api")
app.include_router(voc.router, prefix="/api")
app.include_router(segments.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(interventions.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(ask.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/debug-db")
async def debug_db():
    try:
        p = await get_pool()
        async with p.acquire() as conn:
            row = await conn.fetchrow("SELECT 1 as ok, current_database() as db, version() as v")
            return {"status": "connected", "db": row["db"], "version": row["v"][:50]}
    except Exception as e:
        return {"status": "error", "error": str(e), "type": type(e).__name__}
