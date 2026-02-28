from contextlib import asynccontextmanager

import asyncpg

from app.config import settings

pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
        pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)
    return pool


async def close_pool():
    global pool
    if pool:
        await pool.close()
        pool = None


async def fetch_all(query: str, *args):
    p = await get_pool()
    async with p.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]


async def fetch_one(query: str, *args):
    p = await get_pool()
    async with p.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def execute(query: str, *args):
    p = await get_pool()
    async with p.acquire() as conn:
        return await conn.execute(query, *args)
