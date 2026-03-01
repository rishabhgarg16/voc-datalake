"""
Ingest order_data.json into the Customer Datalake.

Tables populated: brands, orders, order_line_items
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

import psycopg2
import psycopg2.extras

from app.config import settings
from app.ingestion.common import _upsert_brand

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_custom_attributes(attrs: list[dict]) -> dict:
    """
    Turn the customAttributes list into a flat dict.
    Expected keys: verifast_session, utm_source, utm_medium, utm_campaign,
                   full_url, user_agent, customer_ip
    """
    result = {}
    for item in (attrs or []):
        key = item.get("key", "")
        value = item.get("value", "")
        result[key] = value
    return result


def _extract_domain_from_url(url: str) -> str | None:
    """Extract store domain from a URL like https://domain.myshopify.com/..."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
        return parsed.netloc or None
    except Exception:
        return None


def _extract_utm_from_url(url: str) -> dict:
    """Pull UTM params from the landing URL query string."""
    result = {"utm_source": None, "utm_medium": None, "utm_campaign": None}
    if not url:
        return result
    try:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        result["utm_source"] = qs.get("utm_source", [None])[0]
        result["utm_medium"] = qs.get("utm_medium", [None])[0]
        result["utm_campaign"] = qs.get("utm_campaign", [None])[0]
    except Exception:
        pass
    return result


# ---------------------------------------------------------------------------
# Main ingestion
# ---------------------------------------------------------------------------
def ingest(conn) -> dict:
    """Run the orders ingestion. Returns counts dict."""
    data_path = os.path.join(settings.data_dir, "order_data.json")
    print(f"[orders] Loading {data_path} ...")
    with open(data_path, "r", encoding="utf-8") as f:
        records = json.load(f)
    total = len(records)
    print(f"[orders] Loaded {total:,} records.")

    counts = {"orders": 0, "order_line_items": 0}
    cur = conn.cursor()

    for batch_start in range(0, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)
        batch = records[batch_start:batch_end]

        for rec in batch:
            shopify_order_id = rec.get("id", "")
            order_name = rec.get("name", "")
            created_at_str = rec.get("createdAt")
            created_at = None
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(
                        created_at_str.replace("Z", "+00:00")
                    )
                except ValueError:
                    pass

            # Subtotal
            subtotal_set = rec.get("currentSubtotalPriceSet") or {}
            presentment = subtotal_set.get("presentmentMoney") or {}
            subtotal_amount = presentment.get("amount")
            currency = presentment.get("currencyCode")
            if subtotal_amount is not None:
                try:
                    subtotal_amount = float(subtotal_amount)
                except (ValueError, TypeError):
                    subtotal_amount = None

            email = rec.get("email")
            phone = rec.get("phone")
            client_ip = rec.get("clientIp")

            # Discount codes
            discount_codes_raw = rec.get("discountCodes") or []
            discount_codes = [
                d if isinstance(d, str) else d.get("code", str(d))
                for d in discount_codes_raw
            ] if discount_codes_raw else []

            # Custom attributes
            ca = _parse_custom_attributes(rec.get("customAttributes"))
            verifast_session = ca.get("verifast_session")
            utm_source_attr = ca.get("utm_source")
            full_url = ca.get("full_url")
            user_agent = ca.get("user_agent")
            customer_ip = ca.get("customer_ip")

            # If client_ip from top-level is null, fall back to custom attribute
            if not client_ip:
                client_ip = customer_ip

            # Determine brand from full_url domain
            store_domain = _extract_domain_from_url(full_url)
            if not store_domain:
                # Fallback: try to find indexName-like domain; skip if none
                continue
            brand_id = _upsert_brand(cur, store_domain)

            # UTM: prefer customAttributes, fall back to URL params
            url_utm = _extract_utm_from_url(full_url)
            utm_source = utm_source_attr or url_utm["utm_source"]
            utm_medium = ca.get("utm_medium") or url_utm["utm_medium"]
            utm_campaign = ca.get("utm_campaign") or url_utm["utm_campaign"]

            # Insert order
            cur.execute(
                """
                INSERT INTO orders (
                    brand_id, shopify_order_id, order_name, created_at,
                    subtotal_amount, currency, email, phone, client_ip,
                    discount_codes, utm_source, utm_medium, utm_campaign,
                    verifast_session, user_agent, landing_url
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s
                )
                ON CONFLICT (brand_id, shopify_order_id) DO NOTHING
                RETURNING id
                """,
                (
                    brand_id,
                    shopify_order_id,
                    order_name,
                    created_at,
                    subtotal_amount,
                    currency,
                    email,
                    phone,
                    client_ip,
                    discount_codes,
                    utm_source,
                    utm_medium,
                    utm_campaign,
                    verifast_session,
                    user_agent,
                    full_url,
                ),
            )
            row = cur.fetchone()
            if row is None:
                # Conflict: order already exists, skip line items
                continue
            order_db_id = row[0]
            counts["orders"] += 1

            # Line items
            line_items_container = rec.get("lineItems") or {}
            edges = line_items_container.get("edges") or []
            li_inserts = []
            for edge in edges:
                node = edge.get("node") or {}
                product = node.get("product") or {}
                shopify_product_id = product.get("id")
                product_name = node.get("name")
                quantity = node.get("quantity") or node.get("currentQuantity")
                li_inserts.append((
                    order_db_id,
                    shopify_product_id,
                    product_name,
                    quantity,
                ))
            if li_inserts:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO order_line_items
                        (order_id, shopify_product_id, product_name, quantity)
                    VALUES %s
                    """,
                    li_inserts,
                    template="(%s, %s, %s, %s)",
                    page_size=500,
                )
                counts["order_line_items"] += len(li_inserts)

        conn.commit()
        print(f"[orders] Processed {batch_end:,} / {total:,} orders")

    cur.close()
    return counts


# ---------------------------------------------------------------------------
# Standalone entry
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    dsn = settings.database_url_sync
    print("[orders] Connecting to DB ...")
    conn = psycopg2.connect(dsn)
    try:
        result = ingest(conn)
        print(f"[orders] Done. {result}")
    finally:
        conn.close()
