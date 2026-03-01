"""
Shared helpers for ingestion modules.
"""

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
