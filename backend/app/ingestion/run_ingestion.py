"""
CLI entry point for running the full ETL ingestion pipeline.

Usage:
    python -m app.ingestion.run_ingestion

Runs all 3 ingestion steps in order:
  1. User profiles  (user_profiling.json)
  2. Orders         (order_data.json)
  3. Chat conversations (grandmaasecret_chat (1).json)

Then prints a summary of row counts per table.
"""

import sys
import time

import psycopg2
from psycopg2 import sql

from app.config import settings


def _table_count(cur, table: str) -> int:
    cur.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table)))
    return cur.fetchone()[0]


def main():
    dsn = settings.database_url_sync
    print("=" * 60)
    print("  Customer Datalake  --  ETL Ingestion Pipeline")
    print("=" * 60)
    print(f"\nConnecting to database ...")
    conn = psycopg2.connect(dsn)
    print("Connected.\n")

    overall_start = time.time()
    results = {}

    # ------------------------------------------------------------------
    # Step 1: Profiles
    # ------------------------------------------------------------------
    print("-" * 60)
    print("STEP 1/3: Ingesting user profiles ...")
    print("-" * 60)
    t0 = time.time()
    from app.ingestion.ingest_profiles import ingest as ingest_profiles

    results["profiles"] = ingest_profiles(conn)
    print(f"  Completed in {time.time() - t0:.1f}s\n")

    # ------------------------------------------------------------------
    # Step 2: Orders
    # ------------------------------------------------------------------
    print("-" * 60)
    print("STEP 2/3: Ingesting orders ...")
    print("-" * 60)
    t0 = time.time()
    from app.ingestion.ingest_orders import ingest as ingest_orders

    results["orders"] = ingest_orders(conn)
    print(f"  Completed in {time.time() - t0:.1f}s\n")

    # ------------------------------------------------------------------
    # Step 3: Chats
    # ------------------------------------------------------------------
    print("-" * 60)
    print("STEP 3/3: Ingesting chat conversations ...")
    print("-" * 60)
    t0 = time.time()
    from app.ingestion.ingest_chats import ingest as ingest_chats

    results["chats"] = ingest_chats(conn)
    print(f"  Completed in {time.time() - t0:.1f}s\n")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    elapsed = time.time() - overall_start
    print("=" * 60)
    print("  INGESTION COMPLETE")
    print("=" * 60)

    print(f"\nTotal time: {elapsed:.1f}s\n")

    print("Records inserted/upserted per step:")
    for step_name, step_counts in results.items():
        print(f"  [{step_name}]")
        for table, count in step_counts.items():
            print(f"    {table}: {count:,}")

    # Final DB counts
    print("\nFinal table row counts:")
    cur = conn.cursor()
    tables = [
        "brands",
        "user_sessions",
        "session_pages",
        "session_events",
        "session_interventions",
        "orders",
        "order_line_items",
        "chat_conversations",
        "chat_messages",
        "chat_intents",
    ]
    for table in tables:
        try:
            count = _table_count(cur, table)
            print(f"  {table}: {count:,}")
        except Exception as e:
            print(f"  {table}: ERROR ({e})")
            conn.rollback()
    cur.close()
    conn.close()

    print("\nDone.")


if __name__ == "__main__":
    main()
