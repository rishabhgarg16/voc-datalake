import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["segments"])
logger = logging.getLogger(__name__)


@router.get("/brands/{brand_id}/segments")
async def session_segments(
    brand_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Build a CTE that classifies each session into one or more segments
    query = """
        WITH session_flags AS (
            SELECT
                us.id,
                us.session_id,
                us.engagement_score,
                us.visit_count,
                us.is_returning,
                CASE WHEN EXISTS (
                    SELECT 1 FROM chat_conversations cc
                    WHERE cc.session_id = us.session_id AND cc.brand_id = us.brand_id
                ) THEN true ELSE false END AS has_chat,
                CASE WHEN EXISTS (
                    SELECT 1 FROM orders o
                    WHERE o.verifast_session = us.session_id AND o.brand_id = us.brand_id
                ) THEN true ELSE false END AS has_order,
                CASE WHEN EXISTS (
                    SELECT 1 FROM session_interventions si
                    WHERE si.session_id = us.id
                ) THEN true ELSE false END AS has_intervention
            FROM user_sessions us
            WHERE us.brand_id = $1
        )
        SELECT
            'High Intent Drop-off' AS segment,
            COUNT(*) FILTER (
                WHERE engagement_score > 0.6 AND has_order = false
            ) AS session_count
        FROM session_flags
        UNION ALL
        SELECT
            'Chat Converters',
            COUNT(*) FILTER (
                WHERE has_chat = true AND has_order = true
            )
        FROM session_flags
        UNION ALL
        SELECT
            'Silent Converters',
            COUNT(*) FILTER (
                WHERE has_chat = false AND has_order = true
            )
        FROM session_flags
        UNION ALL
        SELECT
            'Window Shoppers',
            COUNT(*) FILTER (
                WHERE visit_count = 1 AND engagement_score < 0.3
            )
        FROM session_flags
        UNION ALL
        SELECT
            'Returning Engaged',
            COUNT(*) FILTER (
                WHERE is_returning = true AND engagement_score > 0.4
            )
        FROM session_flags
        UNION ALL
        SELECT
            'Nudge Responsive',
            COUNT(*) FILTER (
                WHERE has_intervention = true
            )
        FROM session_flags
    """

    try:
        rows = await fetch_all(query, brand_id)

        # Also get total for percentages
        total = await fetch_one(
            "SELECT COUNT(*) AS cnt FROM user_sessions WHERE brand_id = $1",
            brand_id,
        )
    except Exception as e:
        logger.exception("Failed to fetch segment data")
        raise HTTPException(status_code=500, detail="Database query failed")

    total_count = total["cnt"] if total else 0

    segments = []
    for row in rows:
        pct = round(row["session_count"] / total_count, 4) if total_count > 0 else 0
        segments.append({
            "segment": row["segment"],
            "session_count": row["session_count"],
            "percentage": pct,
        })

    return {"brand_id": brand_id, "total_sessions": total_count, "segments": segments}
