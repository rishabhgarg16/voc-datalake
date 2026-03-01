"""
Ingest user_profiling.json into the Customer Datalake.

Tables populated: brands, user_sessions, session_pages, session_events, session_interventions
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse

import psycopg2
import psycopg2.extras

from app.config import settings
from app.ingestion.common import _upsert_brand

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BATCH_SIZE = 1000
PROGRESS_EVERY = 5000
MAX_TIME_ON_PAGE_MS = 3_600_000  # 1 hour cap for normalisation


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_iso_date(val: str | dict | None) -> datetime | None:
    """Parse $date dict or ISO string to datetime."""
    if val is None:
        return None
    if isinstance(val, dict):
        val = val.get("$date", val)
    if isinstance(val, str):
        val = val.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(val)
        except ValueError:
            return None
    return None


def _compute_engagement_score(
    scroll_pct: float,
    time_on_page_ms: int,
    event_count: int,
    is_returning: bool,
) -> float:
    """
    Weighted composite score in [0, 1]:
      scroll_percentage  * 0.3
      normalised time    * 0.3
      normalised events  * 0.2
      is_returning       * 0.2
    """
    scroll_norm = min((scroll_pct or 0) / 100.0, 1.0)
    time_norm = min((time_on_page_ms or 0) / MAX_TIME_ON_PAGE_MS, 1.0)
    event_norm = min((event_count or 0) / 20.0, 1.0)  # cap at 20 events
    returning_val = 1.0 if is_returning else 0.0
    return round(
        scroll_norm * 0.3 + time_norm * 0.3 + event_norm * 0.2 + returning_val * 0.2,
        4,
    )


def _extract_url_parts(url: str) -> dict:
    """Extract UTM params, product_handle, collection_handle from a URL."""
    result = {
        "utm_source": None,
        "utm_medium": None,
        "utm_campaign": None,
        "utm_content": None,
        "product_handle": None,
        "collection_handle": None,
    }
    if not url:
        return result
    try:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        result["utm_source"] = qs.get("utm_source", [None])[0]
        result["utm_medium"] = qs.get("utm_medium", [None])[0]
        result["utm_campaign"] = qs.get("utm_campaign", [None])[0]
        result["utm_content"] = qs.get("utm_content", [None])[0]

        path_parts = [p for p in parsed.path.split("/") if p]
        for i, part in enumerate(path_parts):
            if part == "products" and i + 1 < len(path_parts):
                result["product_handle"] = path_parts[i + 1]
            elif part == "collections" and i + 1 < len(path_parts):
                result["collection_handle"] = path_parts[i + 1]
    except Exception:
        pass
    return result


# ---------------------------------------------------------------------------
# Main ingestion
# ---------------------------------------------------------------------------
def ingest(conn) -> dict:
    """Run the profiles ingestion. Returns counts dict."""
    data_path = os.path.join(settings.data_dir, "user_profiling.json")
    print(f"[profiles] Loading {data_path} ...")
    with open(data_path, "r", encoding="utf-8") as f:
        records = json.load(f)
    total = len(records)
    print(f"[profiles] Loaded {total:,} records.")

    counts = {
        "user_sessions": 0,
        "session_pages": 0,
        "session_events": 0,
        "session_interventions": 0,
    }

    cur = conn.cursor()

    # Process in batches
    for batch_start in range(0, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)
        batch = records[batch_start:batch_end]

        session_rows = []  # tuples for executemany
        pages_pending = []  # (batch_index, page_tuples)
        events_pending = []  # (batch_index, event_tuples)
        interventions_pending = []  # (batch_index, intervention_tuples)

        for i, rec in enumerate(batch):
            session_id = rec.get("sessionId", "")
            store_domain = rec.get("indexName", "")
            if not session_id or not store_domain:
                continue

            brand_id = _upsert_brand(cur, store_domain)

            # Engagement
            engagement = rec.get("engagement") or {}
            scroll = engagement.get("scroll") or {}
            mouse = engagement.get("mouseMovement") or {}
            scroll_position = scroll.get("position")
            scroll_percentage = scroll.get("percentage")
            scroll_direction = scroll.get("direction")
            mouse_speed = mouse.get("speed")
            time_on_page_ms = engagement.get("timeOnPage")

            # Device
            device_info = rec.get("deviceInfo") or {}
            user_agent = device_info.get("browser")
            browser_language = device_info.get("language")

            # Permanent
            perm = rec.get("permanentData") or {}
            visited_days = perm.get("visitedDays") or []
            visit_count = len(visited_days)
            event_count = perm.get("eventCount", 0)
            has_talked_to_bot = perm.get("hasTalkedToBot", False)
            has_placed_order = perm.get("hasPlacedAnOrder", False)

            # Timestamps
            website_landed_time = rec.get("websiteLandedTime")
            last_activity = rec.get("lastActivity")
            synced_at = _parse_iso_date(rec.get("_syncedAt"))

            # Computed
            is_returning = len(visited_days) > 1
            engagement_score = _compute_engagement_score(
                scroll_percentage or 0,
                time_on_page_ms or 0,
                event_count,
                is_returning,
            )

            session_rows.append((
                brand_id,
                session_id,
                scroll_position,
                scroll_percentage,
                scroll_direction,
                mouse_speed,
                time_on_page_ms,
                user_agent,
                browser_language,
                visited_days,
                visit_count,
                event_count,
                has_talked_to_bot,
                has_placed_order,
                website_landed_time,
                last_activity,
                synced_at,
                engagement_score,
                is_returning,
            ))

            # --- Pages ---
            page_list = []
            for page in (rec.get("pagesVisited") or []):
                url = page.get("url", "")
                ts = page.get("timestamp")
                parts = _extract_url_parts(url)
                page_list.append((
                    url,
                    ts,
                    parts["utm_source"],
                    parts["utm_medium"],
                    parts["utm_campaign"],
                    parts["utm_content"],
                    parts["product_handle"],
                    parts["collection_handle"],
                ))
            if page_list:
                pages_pending.append((i, page_list))

            # --- Events ---
            event_list = []
            for evt in (rec.get("eventsDone") or []):
                event_list.append((
                    evt.get("eventName"),
                    evt.get("timestamp"),
                ))
            if event_list:
                events_pending.append((i, event_list))

            # --- Interventions (actionTaken) ---
            action_taken = rec.get("actionTaken") or {}
            int_list = []
            for trigger_type, action_data in action_taken.items():
                if not isinstance(action_data, dict):
                    continue
                config = action_data.get("config") or {}
                nudge_text = config.get("text")
                nudge_variant = config.get("variant")
                action_type = config.get("actionType")
                additional = config.get("additionalActions") or []
                buttons = [
                    a.get("label", a.get("text", ""))
                    for a in additional
                    if isinstance(a, dict)
                ]
                triggered_at = action_data.get("timestamp")
                ttl = action_data.get("ttl")
                int_list.append((
                    trigger_type,
                    action_type,
                    nudge_text,
                    nudge_variant,
                    buttons,
                    triggered_at,
                    ttl,
                ))
            if int_list:
                interventions_pending.append((i, int_list))

        # Bulk insert sessions and collect their DB ids
        if not session_rows:
            continue

        insert_sql = """
            INSERT INTO user_sessions (
                brand_id, session_id,
                scroll_position, scroll_percentage, scroll_direction,
                mouse_speed, time_on_page_ms,
                user_agent, browser_language,
                visited_days, visit_count, event_count,
                has_talked_to_bot, has_placed_order,
                website_landed_time, last_activity, synced_at,
                engagement_score, is_returning
            ) VALUES (
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s
            )
            ON CONFLICT (brand_id, session_id) DO UPDATE SET
                scroll_position = EXCLUDED.scroll_position,
                scroll_percentage = EXCLUDED.scroll_percentage,
                scroll_direction = EXCLUDED.scroll_direction,
                mouse_speed = EXCLUDED.mouse_speed,
                time_on_page_ms = EXCLUDED.time_on_page_ms,
                user_agent = EXCLUDED.user_agent,
                browser_language = EXCLUDED.browser_language,
                visited_days = EXCLUDED.visited_days,
                visit_count = EXCLUDED.visit_count,
                event_count = EXCLUDED.event_count,
                has_talked_to_bot = EXCLUDED.has_talked_to_bot,
                has_placed_order = EXCLUDED.has_placed_order,
                website_landed_time = EXCLUDED.website_landed_time,
                last_activity = EXCLUDED.last_activity,
                synced_at = EXCLUDED.synced_at,
                engagement_score = EXCLUDED.engagement_score,
                is_returning = EXCLUDED.is_returning
            RETURNING id
        """
        db_ids = []
        for row in session_rows:
            cur.execute(insert_sql, row)
            db_ids.append(cur.fetchone()[0])
        counts["user_sessions"] += len(db_ids)

        # Insert pages
        if pages_pending:
            page_inserts = []
            for batch_idx, pages in pages_pending:
                db_id = db_ids[batch_idx]
                for p in pages:
                    page_inserts.append((db_id,) + p)
            if page_inserts:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO session_pages
                        (session_id, page_url, page_timestamp,
                         utm_source, utm_medium, utm_campaign, utm_content,
                         product_handle, collection_handle)
                    VALUES %s
                    """,
                    page_inserts,
                    template="(%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    page_size=1000,
                )
                counts["session_pages"] += len(page_inserts)

        # Insert events
        if events_pending:
            event_inserts = []
            for batch_idx, events in events_pending:
                db_id = db_ids[batch_idx]
                for e in events:
                    event_inserts.append((db_id,) + e)
            if event_inserts:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO session_events (session_id, event_name, event_timestamp)
                    VALUES %s
                    """,
                    event_inserts,
                    template="(%s, %s, %s)",
                    page_size=1000,
                )
                counts["session_events"] += len(event_inserts)

        # Insert interventions
        if interventions_pending:
            int_inserts = []
            for batch_idx, ints in interventions_pending:
                db_id = db_ids[batch_idx]
                for iv in ints:
                    int_inserts.append((db_id,) + iv)
            if int_inserts:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO session_interventions
                        (session_id, trigger_type, action_type,
                         nudge_text, nudge_variant, buttons,
                         triggered_at, ttl)
                    VALUES %s
                    """,
                    int_inserts,
                    template="(%s, %s, %s, %s, %s, %s, %s, %s)",
                    page_size=1000,
                )
                counts["session_interventions"] += len(int_inserts)

        conn.commit()

        if (batch_end % PROGRESS_EVERY == 0) or batch_end == total:
            print(f"[profiles] Processed {batch_end:,} / {total:,} records")

    cur.close()
    return counts


# ---------------------------------------------------------------------------
# Standalone entry
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    dsn = settings.database_url_sync
    print(f"[profiles] Connecting to DB ...")
    conn = psycopg2.connect(dsn)
    try:
        result = ingest(conn)
        print(f"[profiles] Done. {result}")
    finally:
        conn.close()
