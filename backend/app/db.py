import asyncio
import ssl
import logging

import asyncpg

from app.config import settings

logger = logging.getLogger(__name__)
pool: asyncpg.Pool | None = None
_pool_lock = asyncio.Lock()


async def get_pool() -> asyncpg.Pool:
    global pool
    if pool is not None:
        return pool
    async with _pool_lock:
        if pool is not None:
            return pool
        dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
        kwargs: dict = {"dsn": dsn, "min_size": 2, "max_size": 10}

        # Cloud DBs require SSL
        if settings.is_production or "supabase" in dsn:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            kwargs["ssl"] = ctx

        # Supabase transaction-mode pooler: disable prepared statement cache
        if "pooler.supabase" in dsn or ":6543" in dsn:
            kwargs["statement_cache_size"] = 0

        logger.info("Connecting to database...")
        pool = await asyncpg.create_pool(**kwargs)
        logger.info("Database pool created successfully")
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
