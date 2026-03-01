from contextlib import asynccontextmanager
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
        # Double-check after acquiring lock
        if pool is not None:
            return pool
        dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")

        # Force IPv4 for Supabase (Render can't reach IPv6)
        server_settings = {}
        kwargs: dict = {"dsn": dsn, "min_size": 2, "max_size": 10}

        # Supabase and most cloud DBs require SSL
        if settings.is_production or "supabase" in dsn:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            kwargs["ssl"] = ctx

        # Supabase pooler (transaction mode) requires no prepared statements
        if "pooler.supabase" in dsn or ":6543" in dsn:
            kwargs["statement_cache_size"] = 0
            kwargs["prepared_statement_cache_size"] = 0
            server_settings["prepared_statement_cache_size"] = "0"

        if server_settings:
            kwargs["server_settings"] = server_settings

        logger.info(f"Connecting to database...")
        try:
            pool = await asyncpg.create_pool(**kwargs)
            logger.info("Database pool created successfully")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
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
