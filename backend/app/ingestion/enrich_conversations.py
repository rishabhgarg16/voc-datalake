"""
LLM Enrichment Worker
=====================
Processes un-enriched chat conversations through OpenAI GPT-4o-mini to extract
structured intelligence: intents, objections, competitor mentions,
sentiment, persona tags, and more.

Usage:
    python -m app.ingestion.enrich_conversations
"""

import asyncio
import json
import sys
import traceback

import asyncpg
from openai import OpenAI

from app.config import settings


# ------------------------------------------------------------------ #
# Database helpers (standalone — not reusing FastAPI pool)
# ------------------------------------------------------------------ #

async def _get_pool() -> asyncpg.Pool:
    dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    return await asyncpg.create_pool(dsn, min_size=2, max_size=20)


# ------------------------------------------------------------------ #
# LLM prompt
# ------------------------------------------------------------------ #

SYSTEM_PROMPT = """\
You are an expert e-commerce analyst. You will be given a chat conversation
between a shopper and an AI sales assistant on an online store, along with
any detected intents and order outcome.

Analyse the conversation and return a JSON object with EXACTLY these fields:

{
  "primary_intent": "<string: the main reason the shopper chatted, e.g. product_inquiry, price_comparison, sizing_help, purchase_assistance, complaint, returns, general_browsing>",
  "purchase_readiness": "<string: one of high, medium, low, none>",
  "price_sensitivity": "<string: one of high, medium, low, none>",
  "knowledge_level": "<string: one of expert, intermediate, beginner, unknown>",
  "objections": [
    {"objection": "<string>", "severity": "<high|medium|low>", "resolved": <true|false>}
  ],
  "competitor_mentions": [
    {"competitor_name": "<string>", "context": "<string: what was said>", "sentiment_vs_brand": "<positive|neutral|negative>", "verbatim_quote": "<exact quote or null>"}
  ],
  "product_feedback": [
    {"aspect": "<string>", "sentiment": "<positive|neutral|negative>", "detail": "<string>"}
  ],
  "information_gaps": [
    {"customer_question": "<string>", "agent_response_quality": "<answered|partial|unanswered>", "shopper_reaction": "<satisfied|neutral|frustrated>", "product_context": "<string or null>"}
  ],
  "demand_signals": [
    {"signal": "<string: e.g. asked for bundle, wanted faster shipping>", "strength": "<strong|moderate|weak>"}
  ],
  "sentiment": {
    "score": <float between -1.0 and 1.0>,
    "trajectory": "<improving|stable|declining>",
    "emotional_state": "<string: e.g. curious, frustrated, excited, neutral>"
  },
  "persona_tags": ["<string>"],
  "purchase_blockers": ["<string>"]
}

Rules:
- Return ONLY valid JSON, no markdown fences, no commentary.
- If a field has no data, use an empty array [] or appropriate default.
- Be precise; do not hallucinate information not present in the conversation.
"""


def _build_user_prompt(messages: list[dict], intents: list[dict], outcome: str) -> str:
    parts = ["## Chat transcript\n"]
    for m in messages:
        actor = m["actor"] or "unknown"
        text = m["message_text"] or ""
        parts.append(f"[{actor}]: {text}")

    if intents:
        parts.append("\n## Detected intents")
        for i in intents:
            parts.append(f"- primary: {i['primary_intent']}, secondary: {i['secondary_intent']}")

    parts.append(f"\n## Outcome: {outcome}")
    return "\n".join(parts)


# ------------------------------------------------------------------ #
# Core enrichment logic
# ------------------------------------------------------------------ #

async def enrich_one(
    pool: asyncpg.Pool,
    client: OpenAI,
    semaphore: asyncio.Semaphore,
    conv: dict,
    progress: str,
):
    """Enrich a single conversation."""
    async with semaphore:
        conv_id = conv["id"]
        brand_id = conv["brand_id"]
        session_id = conv["session_id"]

        try:
            # 1. Fetch messages
            messages = await pool.fetch(
                "SELECT actor, message_text, message_order "
                "FROM chat_messages WHERE conversation_id = $1 "
                "ORDER BY message_order",
                conv_id,
            )
            messages = [dict(m) for m in messages]

            if not messages:
                print(f"  [{progress}] conv {conv_id}: no messages, skipping")
                return

            # 2. Fetch intents
            intents = await pool.fetch(
                "SELECT primary_intent, secondary_intent "
                "FROM chat_intents WHERE conversation_id = $1",
                conv_id,
            )
            intents = [dict(i) for i in intents]

            # 3. Check for matching order
            order = await pool.fetchrow(
                "SELECT id, subtotal_amount FROM orders "
                "WHERE brand_id = $1 AND verifast_session = $2 LIMIT 1",
                brand_id, session_id,
            )
            outcome = "purchased" if order else "did_not_purchase"

            # 4. Call OpenAI
            user_prompt = _build_user_prompt(messages, intents, outcome)

            response = await asyncio.to_thread(
                client.chat.completions.create,
                model=settings.enrichment_model,
                max_tokens=2048,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()

            data = json.loads(raw)

            # 5-7. Insert enriched data in a single transaction
            async with pool.acquire() as conn:
                async with conn.transaction():
                    # 5. Insert enriched_conversations
                    await conn.execute(
                        """
                        INSERT INTO enriched_conversations (
                            conversation_id, brand_id, session_id, outcome,
                            primary_intent, purchase_readiness, price_sensitivity, knowledge_level,
                            objections, competitor_mentions, product_feedback,
                            information_gaps, demand_signals,
                            sentiment_score, sentiment_trajectory, emotional_state,
                            persona_tags, purchase_blockers,
                            enrichment_model, enrichment_version, enriched_at
                        ) VALUES (
                            $1, $2, $3, $4,
                            $5, $6, $7, $8,
                            $9, $10, $11,
                            $12, $13,
                            $14, $15, $16,
                            $17, $18,
                            $19, 1, NOW()
                        )
                        ON CONFLICT (conversation_id) DO NOTHING
                        """,
                        conv_id,
                        brand_id,
                        session_id,
                        outcome,
                        data.get("primary_intent"),
                        data.get("purchase_readiness"),
                        data.get("price_sensitivity"),
                        data.get("knowledge_level"),
                        json.dumps(data.get("objections", [])),
                        json.dumps(data.get("competitor_mentions", [])),
                        json.dumps(data.get("product_feedback", [])),
                        json.dumps(data.get("information_gaps", [])),
                        json.dumps(data.get("demand_signals", [])),
                        data.get("sentiment", {}).get("score"),
                        data.get("sentiment", {}).get("trajectory"),
                        data.get("sentiment", {}).get("emotional_state"),
                        data.get("persona_tags", []),
                        data.get("purchase_blockers", []),
                        settings.enrichment_model,
                    )

                    # 6. Insert competitor_mentions (denormalized)
                    for cm in data.get("competitor_mentions", []):
                        if not cm.get("competitor_name"):
                            continue
                        await conn.execute(
                            """
                            INSERT INTO competitor_mentions (
                                brand_id, conversation_id, session_id,
                                competitor_name, mention_context,
                                sentiment_vs_brand, verbatim_quote, outcome
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            """,
                            brand_id,
                            conv_id,
                            session_id,
                            cm["competitor_name"],
                            cm.get("context"),
                            cm.get("sentiment_vs_brand"),
                            cm.get("verbatim_quote"),
                            outcome,
                        )

                    # 7. Insert information_gaps (denormalized)
                    for ig in data.get("information_gaps", []):
                        if not ig.get("customer_question"):
                            continue
                        await conn.execute(
                            """
                            INSERT INTO information_gaps (
                                brand_id, conversation_id,
                                customer_question, agent_response_quality,
                                shopper_reaction, product_context
                            ) VALUES ($1, $2, $3, $4, $5, $6)
                            """,
                            brand_id,
                            conv_id,
                            ig["customer_question"],
                            ig.get("agent_response_quality"),
                            ig.get("shopper_reaction"),
                            ig.get("product_context"),
                        )

            print(f"  [{progress}] conv {conv_id}: enriched ({outcome})")

        except json.JSONDecodeError as e:
            print(f"  [{progress}] conv {conv_id}: JSON parse error — {e}")
        except Exception as e:
            print(f"  [{progress}] conv {conv_id}: ERROR — {e}")
            traceback.print_exc()


async def run():
    """Main entry point: find un-enriched conversations and process them."""
    print("=" * 60)
    print("VoC Enrichment Worker (OpenAI GPT-4o-mini)")
    print("=" * 60)

    if not settings.openai_api_key:
        print("ERROR: OPENAI_API_KEY not set. Exiting.")
        sys.exit(1)

    pool = await _get_pool()
    client = OpenAI(api_key=settings.openai_api_key)
    semaphore = asyncio.Semaphore(settings.enrichment_concurrency)

    # Find conversations not yet enriched
    rows = await pool.fetch(
        """
        SELECT cc.id, cc.brand_id, cc.session_id
        FROM chat_conversations cc
        LEFT JOIN enriched_conversations ec ON ec.conversation_id = cc.id
        WHERE ec.id IS NULL
        ORDER BY cc.id
        """
    )
    conversations = [dict(r) for r in rows]
    total = len(conversations)

    if total == 0:
        print("No un-enriched conversations found. Done.")
        await pool.close()
        return

    print(f"Found {total} conversations to enrich "
          f"(concurrency={settings.enrichment_concurrency})")

    tasks = []
    for idx, conv in enumerate(conversations, 1):
        progress = f"{idx}/{total}"
        tasks.append(enrich_one(pool, client, semaphore, conv, progress))

    await asyncio.gather(*tasks)

    # Summary
    enriched_count = await pool.fetchval(
        "SELECT COUNT(*) FROM enriched_conversations"
    )
    print(f"\nDone. Total enriched conversations: {enriched_count}")
    await pool.close()


if __name__ == "__main__":
    asyncio.run(run())
