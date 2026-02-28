from typing import Optional

from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["attribution"])


@router.get("/brands/{brand_id}/channel-voc")
async def channel_voc(
    brand_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Channel-level metrics from materialized view
    channels = await fetch_all(
        """
        SELECT utm_source, session_count, chat_count, order_count,
               conversion_rate, total_revenue, avg_engagement_score
        FROM mv_utm_attribution
        WHERE brand_id = $1
        ORDER BY session_count DESC
        """,
        brand_id,
    )

    # For each channel, get top objections by joining enriched_conversations
    # with session_pages via user_sessions
    channel_objections = await fetch_all(
        """
        SELECT
            COALESCE(sp.utm_source, 'direct') AS utm_source,
            obj->>'objection' AS objection,
            COUNT(*) AS cnt
        FROM enriched_conversations ec
        JOIN user_sessions us
            ON us.session_id = ec.session_id AND us.brand_id = ec.brand_id
        JOIN session_pages sp ON sp.session_id = us.id
        CROSS JOIN jsonb_array_elements(ec.objections) AS obj
        WHERE ec.brand_id = $1
          AND jsonb_array_length(ec.objections) > 0
        GROUP BY COALESCE(sp.utm_source, 'direct'), obj->>'objection'
        ORDER BY COALESCE(sp.utm_source, 'direct'), cnt DESC
        """,
        brand_id,
    )

    # Group objections by utm_source (top 3 per channel)
    objections_by_channel: dict[str, list] = {}
    for row in channel_objections:
        src = row["utm_source"]
        if src not in objections_by_channel:
            objections_by_channel[src] = []
        if len(objections_by_channel[src]) < 3:
            objections_by_channel[src].append(
                {"objection": row["objection"], "count": row["cnt"]}
            )

    # Merge
    result = []
    for ch in channels:
        ch_dict = dict(ch)
        ch_dict["top_objections"] = objections_by_channel.get(ch["utm_source"], [])
        result.append(ch_dict)

    return {"brand_id": brand_id, "channels": result}
