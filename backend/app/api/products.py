import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["products"])
logger = logging.getLogger(__name__)


@router.get("/brands/{brand_id}/products")
async def product_interest(
    brand_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    try:
        rows = await fetch_all(
            """
            SELECT product_handle, view_count, unique_sessions,
                   sessions_with_order, conversion_rate
            FROM mv_product_interest
            WHERE brand_id = $1
            ORDER BY view_count DESC
            """,
            brand_id,
        )
    except Exception as e:
        logger.exception("Failed to fetch product interest data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "products": rows}
