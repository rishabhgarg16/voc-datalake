from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.db import fetch_all, fetch_one

router = APIRouter(tags=["sessions"])


@router.get("/brands/{brand_id}/sessions")
async def list_sessions(
    brand_id: int,
    has_chat: Optional[bool] = None,
    has_order: Optional[bool] = None,
    min_engagement: Optional[float] = None,
    utm_source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    conditions = ["us.brand_id = $1"]
    args: list = [brand_id]
    idx = 2

    if has_chat is True:
        conditions.append(
            f"EXISTS (SELECT 1 FROM chat_conversations cc "
            f"WHERE cc.session_id = us.session_id AND cc.brand_id = us.brand_id)"
        )
    elif has_chat is False:
        conditions.append(
            f"NOT EXISTS (SELECT 1 FROM chat_conversations cc "
            f"WHERE cc.session_id = us.session_id AND cc.brand_id = us.brand_id)"
        )

    if has_order is True:
        conditions.append(
            f"EXISTS (SELECT 1 FROM orders o "
            f"WHERE o.verifast_session = us.session_id AND o.brand_id = us.brand_id)"
        )
    elif has_order is False:
        conditions.append(
            f"NOT EXISTS (SELECT 1 FROM orders o "
            f"WHERE o.verifast_session = us.session_id AND o.brand_id = us.brand_id)"
        )

    if min_engagement is not None:
        conditions.append(f"us.engagement_score >= ${idx}")
        args.append(min_engagement)
        idx += 1

    if utm_source is not None:
        conditions.append(
            f"EXISTS (SELECT 1 FROM session_pages sp "
            f"WHERE sp.session_id = us.id AND sp.utm_source = ${idx})"
        )
        args.append(utm_source)
        idx += 1

    if date_from:
        conditions.append(f"us.synced_at >= ${idx}::timestamptz")
        args.append(date_from)
        idx += 1

    if date_to:
        conditions.append(f"us.synced_at <= ${idx}::timestamptz")
        args.append(date_to)
        idx += 1

    where_clause = " AND ".join(conditions)
    offset = (page - 1) * page_size

    # Get total count
    count_row = await fetch_one(
        f"SELECT COUNT(*) AS cnt FROM user_sessions us WHERE {where_clause}",
        *args,
    )
    total = count_row["cnt"] if count_row else 0

    # Get page of sessions
    args_with_pagination = args + [page_size, offset]
    rows = await fetch_all(
        f"""
        SELECT
            us.id, us.session_id, us.engagement_score,
            us.visit_count, us.is_returning, us.has_talked_to_bot,
            us.has_placed_order, us.synced_at,
            us.scroll_percentage, us.time_on_page_ms
        FROM user_sessions us
        WHERE {where_clause}
        ORDER BY us.id DESC
        LIMIT ${idx} OFFSET ${idx + 1}
        """,
        *args_with_pagination,
    )

    return {
        "brand_id": brand_id,
        "page": page,
        "page_size": page_size,
        "total": total,
        "sessions": rows,
    }


@router.get("/brands/{brand_id}/sessions/{session_id}")
async def session_detail(brand_id: int, session_id: str):
    brand = await fetch_one("SELECT id FROM brands WHERE id = $1", brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Session profile
    profile = await fetch_one(
        """
        SELECT * FROM user_sessions
        WHERE brand_id = $1 AND session_id = $2
        """,
        brand_id, session_id,
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Session not found")

    us_id = profile["id"]

    # Pages
    pages = await fetch_all(
        "SELECT * FROM session_pages WHERE session_id = $1 ORDER BY page_timestamp",
        us_id,
    )

    # Events
    events = await fetch_all(
        "SELECT * FROM session_events WHERE session_id = $1 ORDER BY event_timestamp",
        us_id,
    )

    # Interventions
    interventions = await fetch_all(
        "SELECT * FROM session_interventions WHERE session_id = $1 ORDER BY triggered_at",
        us_id,
    )

    # Chat conversation + messages
    conversation = await fetch_one(
        """
        SELECT * FROM chat_conversations
        WHERE brand_id = $1 AND session_id = $2
        """,
        brand_id, session_id,
    )

    chat_messages = []
    if conversation:
        chat_messages = await fetch_all(
            """
            SELECT actor, message_text, created_at, message_order
            FROM chat_messages
            WHERE conversation_id = $1
            ORDER BY message_order
            """,
            conversation["id"],
        )

    # Enrichment
    enrichment = await fetch_one(
        """
        SELECT * FROM enriched_conversations
        WHERE brand_id = $1 AND session_id = $2
        """,
        brand_id, session_id,
    )

    # Order
    order = await fetch_one(
        """
        SELECT * FROM orders
        WHERE brand_id = $1 AND verifast_session = $2
        """,
        brand_id, session_id,
    )

    order_items = []
    if order:
        order_items = await fetch_all(
            "SELECT * FROM order_line_items WHERE order_id = $1",
            order["id"],
        )

    return {
        "brand_id": brand_id,
        "session_id": session_id,
        "profile": profile,
        "pages": pages,
        "events": events,
        "interventions": interventions,
        "conversation": conversation,
        "chat_messages": chat_messages,
        "enrichment": enrichment,
        "order": order,
        "order_items": order_items,
    }
