import logging

from fastapi import APIRouter, HTTPException

from app.db import fetch_one

router = APIRouter(tags=["funnel"])
logger = logging.getLogger(__name__)


@router.get("/brands/{brand_id}/funnel")
async def conversion_funnel(brand_id: int):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    try:
        funnel = await fetch_one(
            "SELECT * FROM mv_conversion_funnel WHERE brand_id = $1", brand_id
        )
    except Exception as e:
        logger.exception("Failed to fetch conversion funnel data")
        raise HTTPException(status_code=500, detail="Database query failed")

    if not funnel:
        return {
            "brand_id": brand_id,
            "stages": [
                {"stage": "visited", "count": 0},
                {"stage": "viewed_product", "count": 0},
                {"stage": "engaged", "count": 0},
                {"stage": "chatted", "count": 0},
                {"stage": "ordered", "count": 0},
            ],
        }

    return {
        "brand_id": brand_id,
        "stages": [
            {"stage": "visited", "count": funnel["visited"]},
            {"stage": "viewed_product", "count": funnel["viewed_product"]},
            {"stage": "engaged", "count": funnel["engaged"]},
            {"stage": "chatted", "count": funnel["chatted"]},
            {"stage": "ordered", "count": funnel["ordered"]},
        ],
    }
