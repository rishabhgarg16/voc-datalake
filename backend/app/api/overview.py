from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["overview"])


@router.get("/brands/{brand_id}/overview")
async def brand_overview(brand_id: int):
    # Verify brand exists
    brand = await fetch_one("SELECT id, display_name FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # KPIs from materialized view
    overview = await fetch_one(
        "SELECT * FROM mv_brand_overview WHERE brand_id = $1", brand_id
    )

    # Top objection from enriched_conversations
    top_objection = await fetch_one(
        """
        SELECT obj->>'objection' AS objection, COUNT(*) AS cnt
        FROM enriched_conversations ec,
             jsonb_array_elements(ec.objections) AS obj
        WHERE ec.brand_id = $1
        GROUP BY obj->>'objection'
        ORDER BY cnt DESC
        LIMIT 1
        """,
        brand_id,
    )

    # Top competitor
    top_competitor = await fetch_one(
        """
        SELECT competitor_name, COUNT(*) AS cnt
        FROM competitor_mentions
        WHERE brand_id = $1
        GROUP BY competitor_name
        ORDER BY cnt DESC
        LIMIT 1
        """,
        brand_id,
    )

    return {
        "brand": brand,
        "kpis": overview,
        "top_objection": top_objection,
        "top_competitor": top_competitor,
    }


@router.get("/brands/{brand_id}/trends")
async def brand_trends(brand_id: int):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    rows = await fetch_all(
        """
        SELECT day, sessions, chats, orders, avg_engagement
        FROM mv_daily_trends
        WHERE brand_id = $1
        ORDER BY day
        """,
        brand_id,
    )
    return {
        "brand_id": brand_id,
        "trends": [
            {
                "date": str(r["day"]),
                "sessions": r["sessions"],
                "chats": r["chats"],
                "orders": r["orders"],
                "avg_engagement": float(r["avg_engagement"]) if r["avg_engagement"] else 0,
            }
            for r in rows
        ],
    }
