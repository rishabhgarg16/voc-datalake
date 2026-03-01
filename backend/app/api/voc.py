import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["voc"])
logger = logging.getLogger(__name__)


@router.get("/brands/{brand_id}/voc/intents")
async def intent_distribution(
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
            SELECT primary_intent, secondary_intent, intent_count, conversion_count
            FROM mv_intent_distribution
            WHERE brand_id = $1
            ORDER BY intent_count DESC
            """,
            brand_id,
        )
    except Exception as e:
        logger.exception("Failed to fetch intent distribution data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "intents": rows}


@router.get("/brands/{brand_id}/voc/objections")
async def objections(
    brand_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Unnest JSONB objections array and aggregate
    query = """
        SELECT
            obj->>'objection' AS objection,
            obj->>'severity' AS severity,
            COUNT(*) AS mention_count,
            COUNT(*) FILTER (WHERE (obj->>'resolved')::boolean = true) AS resolved_count,
            COUNT(*) FILTER (WHERE ec.outcome = 'purchased') AS converted_count
        FROM enriched_conversations ec,
             jsonb_array_elements(ec.objections) AS obj
        WHERE ec.brand_id = $1
          AND jsonb_array_length(ec.objections) > 0
    """
    args = [brand_id]
    idx = 2

    if date_from:
        query += f" AND ec.enriched_at >= ${idx}::timestamptz"
        args.append(date_from)
        idx += 1
    if date_to:
        query += f" AND ec.enriched_at <= ${idx}::timestamptz"
        args.append(date_to)
        idx += 1

    query += """
        GROUP BY obj->>'objection', obj->>'severity'
        ORDER BY mention_count DESC
    """

    try:
        rows = await fetch_all(query, *args)
    except Exception as e:
        logger.exception("Failed to fetch objections data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "objections": rows}


@router.get("/brands/{brand_id}/voc/non-buyers")
async def non_buyers(
    brand_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Group by purchase blockers
    query = """
        SELECT
            blocker,
            COUNT(*) AS conversation_count,
            ROUND(AVG(ec.sentiment_score)::numeric, 3) AS avg_sentiment
        FROM enriched_conversations ec,
             UNNEST(ec.purchase_blockers) AS blocker
        WHERE ec.brand_id = $1
          AND ec.outcome != 'purchased'
    """
    args = [brand_id]
    idx = 2

    if date_from:
        query += f" AND ec.enriched_at >= ${idx}::timestamptz"
        args.append(date_from)
        idx += 1
    if date_to:
        query += f" AND ec.enriched_at <= ${idx}::timestamptz"
        args.append(date_to)
        idx += 1

    query += """
        GROUP BY blocker
        ORDER BY conversation_count DESC
    """

    try:
        rows = await fetch_all(query, *args)
    except Exception as e:
        logger.exception("Failed to fetch non-buyer blockers data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "non_buyer_blockers": rows}


@router.get("/brands/{brand_id}/voc/info-gaps")
async def info_gaps(
    brand_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    query = """
        SELECT
            customer_question,
            agent_response_quality,
            COUNT(*) AS frequency,
            MODE() WITHIN GROUP (ORDER BY shopper_reaction) AS most_common_reaction,
            MODE() WITHIN GROUP (ORDER BY product_context) AS most_common_product
        FROM information_gaps
        WHERE brand_id = $1
    """
    args = [brand_id]
    idx = 2

    if date_from:
        query += f" AND created_at >= ${idx}::timestamptz"
        args.append(date_from)
        idx += 1
    if date_to:
        query += f" AND created_at <= ${idx}::timestamptz"
        args.append(date_to)
        idx += 1

    query += """
        GROUP BY customer_question, agent_response_quality
        ORDER BY frequency DESC
    """

    try:
        rows = await fetch_all(query, *args)
    except Exception as e:
        logger.exception("Failed to fetch information gaps data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "information_gaps": rows}


@router.get("/brands/{brand_id}/voc/competitors")
async def competitors(brand_id: int):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    try:
        rows = await fetch_all(
            """
            SELECT
                competitor_name,
                COUNT(*) AS mention_count,
                string_agg(DISTINCT sentiment_vs_brand, ', ') AS sentiments,
                string_agg(DISTINCT mention_context, ' | ') AS contexts
            FROM competitor_mentions
            WHERE brand_id = $1
            GROUP BY competitor_name
            ORDER BY mention_count DESC
            """,
            brand_id,
        )
    except Exception as e:
        logger.exception("Failed to fetch competitor data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "competitors": rows}


@router.get("/brands/{brand_id}/voc/personas")
async def personas(brand_id: int):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    try:
        rows = await fetch_all(
            """
            SELECT tag AS persona, COUNT(*) AS count,
                   COUNT(*) FILTER (WHERE ec.outcome = 'purchased') AS converted,
                   ROUND(AVG(ec.sentiment_score)::numeric, 3) AS avg_sentiment
            FROM enriched_conversations ec, UNNEST(ec.persona_tags) AS tag
            WHERE ec.brand_id = $1
            GROUP BY tag
            ORDER BY count DESC
            """,
            brand_id,
        )
    except Exception as e:
        logger.exception("Failed to fetch persona data")
        raise HTTPException(status_code=500, detail="Database query failed")
    return {"brand_id": brand_id, "personas": rows}
