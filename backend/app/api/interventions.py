import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["interventions"])
logger = logging.getLogger(__name__)


@router.get("/brands/{brand_id}/interventions")
async def intervention_effectiveness(
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
            SELECT trigger_type, triggered_count,
                   sessions_with_subsequent_chat, sessions_with_order
            FROM mv_intervention_effectiveness
            WHERE brand_id = $1
            ORDER BY triggered_count DESC
            """,
            brand_id,
        )
    except Exception as e:
        logger.exception("Failed to fetch intervention effectiveness data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "interventions": rows}
