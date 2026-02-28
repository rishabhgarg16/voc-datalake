"""
Ingest grandmaasecret_chat (1).json into the Customer Datalake.

Tables populated: brands, chat_conversations, chat_messages, chat_intents
"""

import json
import os
import sys
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras

from app.config import settings

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BATCH_SIZE = 500
PROGRESS_EVERY = 500
DEFAULT_BRAND = "grandmaasecret-com.myshopify.com"
CHAT_FILENAME = "grandmaasecret_chat (1).json"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_dt(val: str | None) -> datetime | None:
    """Parse ISO-ish datetime string."""
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except ValueError:
        return None


def _safe_json_parse(val: str | None) -> dict | None:
    """Try to parse a JSON-encoded string; return None on failure."""
    if not val:
        return None
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return None


def _find_field(items: list[dict], key: str) -> str | None:
    """Find a value by key in a list of {key, value} dicts."""
    for item in (items or []):
        if item.get("key") == key:
            return item.get("value")
    return None


# ---------------------------------------------------------------------------
# Brand cache
# ---------------------------------------------------------------------------
_brand_cache: dict[str, int] = {}


def _upsert_brand(cur, store_domain: str) -> int:
    if store_domain in _brand_cache:
        return _brand_cache[store_domain]
    cur.execute(
        """
        INSERT INTO brands (store_domain, display_name)
        VALUES (%s, %s)
        ON CONFLICT (store_domain) DO UPDATE SET store_domain = EXCLUDED.store_domain
        RETURNING id
        """,
        (store_domain, store_domain.split(".")[0]),
    )
    brand_id = cur.fetchone()[0]
    _brand_cache[store_domain] = brand_id
    return brand_id


# ---------------------------------------------------------------------------
# Main ingestion
# ---------------------------------------------------------------------------
def ingest(conn) -> dict:
    """Run the chat ingestion. Returns counts dict."""
    data_path = os.path.join(settings.data_dir, CHAT_FILENAME)
    print(f"[chats] Loading {data_path} ...")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # data is a dict keyed by session_id
    session_ids = list(data.keys())
    total = len(session_ids)
    print(f"[chats] Loaded {total:,} conversations.")

    counts = {
        "chat_conversations": 0,
        "chat_messages": 0,
        "chat_intents": 0,
    }

    cur = conn.cursor()
    brand_id = _upsert_brand(cur, DEFAULT_BRAND)
    conn.commit()

    for batch_start in range(0, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)
        batch_keys = session_ids[batch_start:batch_end]

        for session_id in batch_keys:
            conv = data[session_id]
            if not isinstance(conv, dict):
                continue

            messages = conv.get("messages") or []
            usecases = conv.get("usecases") or []
            user_fields = conv.get("user_fields") or []
            session_meta_list = conv.get("session_meta") or []
            user_attributes = conv.get("user_attributes") or []

            # ---- Parse user_fields ----
            customer_ip = _find_field(user_fields, "invalid_ip")
            customer_location = _find_field(user_fields, "location")
            device_info_raw = _find_field(user_fields, "invalid_device_info")
            device_info = _safe_json_parse(device_info_raw)

            device_os = None
            device_is_mobile = None
            device_browser = None
            screen_size = None
            if device_info:
                device_os = device_info.get("os")
                device_is_mobile = device_info.get("isMobile")
                device_browser = device_info.get("browser")
                # Build screen size string from width/height if available
                w = device_info.get("screenWidth") or device_info.get("width")
                h = device_info.get("screenHeight") or device_info.get("height")
                if w and h:
                    screen_size = f"{w}x{h}"

            # ---- Parse user_attributes ----
            customer_past_data_raw = _find_field(user_attributes, "customer_past_data")
            customer_past_data = _safe_json_parse(customer_past_data_raw)

            customer_email = None
            customer_name = None
            customer_phone = None
            past_orders_count = None
            total_spent = None
            if customer_past_data:
                customer_email = customer_past_data.get("email")
                customer_name = customer_past_data.get("name")
                customer_phone = customer_past_data.get("phone")
                past_orders_count = customer_past_data.get("orders_count")
                raw_spent = customer_past_data.get("total_spent")
                if raw_spent is not None:
                    try:
                        # total_spent in source can be in paise/cents (e.g. 139800)
                        # Schema is DECIMAL(10,2) -- store as-is (let the brand define meaning)
                        total_spent = float(raw_spent)
                    except (ValueError, TypeError):
                        total_spent = None

            has_placed_order_str = _find_field(user_attributes, "has_placed_an_order")
            has_placed_order = None
            if has_placed_order_str is not None:
                has_placed_order = has_placed_order_str in ("1", "true", "True")

            nudge_trigger = _find_field(user_attributes, "proactive_nudge_clicked")

            # ---- Parse session_meta ----
            session_meta = session_meta_list[0] if session_meta_list else {}
            bot_page = session_meta.get("bot_page")
            session_number = session_meta.get("session_number")

            # ---- Message timestamps ----
            message_count = len(messages)
            msg_timestamps = []
            for m in messages:
                dt = _parse_dt(m.get("created_at"))
                if dt:
                    msg_timestamps.append(dt)
            first_message_at = min(msg_timestamps) if msg_timestamps else None
            last_message_at = max(msg_timestamps) if msg_timestamps else None

            # ---- Skip if already ingested (idempotent re-runs) ----
            cur.execute(
                "SELECT id FROM chat_conversations WHERE brand_id = %s AND session_id = %s",
                (brand_id, session_id),
            )
            existing = cur.fetchone()
            if existing:
                continue

            # ---- Insert conversation ----
            cur.execute(
                """
                INSERT INTO chat_conversations (
                    brand_id, session_id, message_count,
                    first_message_at, last_message_at,
                    customer_ip, customer_location,
                    device_os, device_is_mobile, device_browser, screen_size,
                    customer_email, customer_name, customer_phone,
                    past_orders_count, total_spent,
                    has_placed_order, nudge_trigger,
                    bot_page, session_number
                ) VALUES (
                    %s, %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s
                )
                RETURNING id
                """,
                (
                    brand_id,
                    session_id,
                    message_count,
                    first_message_at,
                    last_message_at,
                    customer_ip,
                    customer_location,
                    device_os,
                    device_is_mobile,
                    device_browser,
                    screen_size,
                    customer_email,
                    customer_name,
                    customer_phone,
                    past_orders_count,
                    total_spent,
                    has_placed_order,
                    nudge_trigger,
                    bot_page,
                    session_number,
                ),
            )
            row = cur.fetchone()
            if row is None:
                continue
            conv_db_id = row[0]
            counts["chat_conversations"] += 1

            # ---- Messages ----
            # Sort by created_at to assign message_order
            sorted_msgs = sorted(
                messages,
                key=lambda m: m.get("created_at") or "",
            )
            msg_inserts = []
            for order_idx, m in enumerate(sorted_msgs, start=1):
                actor = m.get("actor")
                text = m.get("text")
                created_at = _parse_dt(m.get("created_at"))
                msg_inserts.append((
                    conv_db_id,
                    actor,
                    text,
                    created_at,
                    order_idx,
                ))
            if msg_inserts:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO chat_messages
                        (conversation_id, actor, message_text, created_at, message_order)
                    VALUES %s
                    """,
                    msg_inserts,
                    template="(%s, %s, %s, %s, %s)",
                    page_size=1000,
                )
                counts["chat_messages"] += len(msg_inserts)

            # ---- Intents / Usecases ----
            intent_inserts = []
            for uc in usecases:
                primary = uc.get("primary")
                secondary = uc.get("secondary")
                created_at = _parse_dt(uc.get("created_at"))
                intent_inserts.append((
                    conv_db_id,
                    primary,
                    secondary,
                    created_at,
                ))
            if intent_inserts:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO chat_intents
                        (conversation_id, primary_intent, secondary_intent, created_at)
                    VALUES %s
                    """,
                    intent_inserts,
                    template="(%s, %s, %s, %s)",
                    page_size=1000,
                )
                counts["chat_intents"] += len(intent_inserts)

        conn.commit()

        if (batch_end % PROGRESS_EVERY == 0) or batch_end == total:
            print(f"[chats] Processed {batch_end:,} / {total:,} conversations")

    cur.close()
    return counts


# ---------------------------------------------------------------------------
# Standalone entry
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    dsn = settings.database_url_sync
    print("[chats] Connecting to DB ...")
    conn = psycopg2.connect(dsn)
    try:
        result = ingest(conn)
        print(f"[chats] Done. {result}")
    finally:
        conn.close()
