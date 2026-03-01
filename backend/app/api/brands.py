import logging

from fastapi import APIRouter, HTTPException

from app.db import fetch_all

router = APIRouter(tags=["brands"])
logger = logging.getLogger(__name__)


@router.get("/brands")
async def list_brands():
    try:
        rows = await fetch_all(
            "SELECT id, store_domain, display_name, created_at FROM brands ORDER BY id"
        )
    except Exception as e:
        logger.exception("Failed to fetch brands")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brands": rows}
