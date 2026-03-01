import asyncio
import json
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from openai import OpenAI

from app.config import settings
from app.db import fetch_all, fetch_one

router = APIRouter(tags=["ask"])

# Simple in-memory rate limiting: max 10 requests/minute per brand
_rate_limit: dict[int, list[float]] = defaultdict(list)
_RATE_LIMIT_MAX = 10
_RATE_LIMIT_WINDOW = 60  # seconds


def _check_rate_limit(brand_id: int) -> None:
    now = time.monotonic()
    timestamps = _rate_limit[brand_id]
    # Remove entries older than the window
    _rate_limit[brand_id] = [t for t in timestamps if now - t < _RATE_LIMIT_WINDOW]
    if len(_rate_limit[brand_id]) >= _RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded: max 10 requests per minute per brand",
        )
    _rate_limit[brand_id].append(now)


class AskRequest(BaseModel):
    question: str = Field(..., max_length=500)


@router.post("/brands/{brand_id}/ask")
async def ask_customers(brand_id: int, body: AskRequest):
    _check_rate_limit(brand_id)
    brand = await fetch_one(
        "SELECT id, display_name FROM brands WHERE id = $1", brand_id
    )
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured",
        )

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Search enriched conversations for relevant data
    relevant = await fetch_all(
        """
        SELECT
            ec.session_id,
            ec.outcome,
            ec.primary_intent,
            ec.purchase_readiness,
            ec.price_sensitivity,
            ec.sentiment_score,
            ec.emotional_state,
            ec.persona_tags,
            ec.purchase_blockers,
            ec.demand_signals
        FROM enriched_conversations ec
        WHERE ec.brand_id = $1
          AND (
              ec.primary_intent ILIKE '%' || $2 || '%'
              OR array_to_string(ec.purchase_blockers, ',') ILIKE '%' || $2 || '%'
              OR array_to_string(ec.persona_tags, ',') ILIKE '%' || $2 || '%'
              OR ec.demand_signals::text ILIKE '%' || $2 || '%'
          )
        LIMIT 30
        """,
        brand_id,
        question,
    )

    # Fall back to broader sample if too few results
    if len(relevant) < 5:
        fallback = await fetch_all(
            """
            SELECT
                ec.session_id,
                ec.outcome,
                ec.primary_intent,
                ec.purchase_readiness,
                ec.price_sensitivity,
                ec.sentiment_score,
                ec.emotional_state,
                ec.persona_tags,
                ec.purchase_blockers,
                ec.demand_signals
            FROM enriched_conversations ec
            WHERE ec.brand_id = $1
            ORDER BY ec.enriched_at DESC NULLS LAST, ec.id DESC
            LIMIT 30
            """,
            brand_id,
        )
        seen = {r["session_id"] for r in relevant}
        for row in fallback:
            if row["session_id"] not in seen:
                relevant.append(row)
                seen.add(row["session_id"])
            if len(relevant) >= 30:
                break

    if not relevant:
        return {
            "brand_id": brand_id,
            "question": question,
            "answer": "No enriched conversation data available for this brand yet.",
            "conversations_analyzed": 0,
        }

    # Also pull aggregate stats
    overview = await fetch_one(
        "SELECT * FROM mv_brand_overview WHERE brand_id = $1", brand_id
    )

    # Also pull top blockers and competitors
    blockers = await fetch_all(
        """
        SELECT blocker, COUNT(*) as cnt
        FROM enriched_conversations ec, UNNEST(ec.purchase_blockers) AS blocker
        WHERE ec.brand_id = $1
        GROUP BY blocker ORDER BY cnt DESC LIMIT 10
        """,
        brand_id,
    )

    competitors = await fetch_all(
        """
        SELECT competitor_name, COUNT(*) as cnt
        FROM competitor_mentions WHERE brand_id = $1
        GROUP BY competitor_name ORDER BY cnt DESC LIMIT 5
        """,
        brand_id,
    )

    info_gaps = await fetch_all(
        """
        SELECT customer_question, COUNT(*) as cnt
        FROM information_gaps WHERE brand_id = $1
        GROUP BY customer_question ORDER BY cnt DESC LIMIT 5
        """,
        brand_id,
    )

    # Build context for LLM
    conversations_text = []
    for r in relevant:
        entry = {
            "session": r["session_id"],
            "outcome": r["outcome"],
            "intent": r["primary_intent"],
            "readiness": r["purchase_readiness"],
            "price_sensitivity": r["price_sensitivity"],
            "sentiment": r["sentiment_score"],
            "emotion": r["emotional_state"],
            "blockers": r["purchase_blockers"],
            "persona": r["persona_tags"],
            "demand_signals": r["demand_signals"],
        }
        conversations_text.append(json.dumps(entry, default=str))

    overview_text = json.dumps(overview, default=str) if overview else "N/A"
    blockers_text = json.dumps([dict(b) for b in blockers], default=str) if blockers else "N/A"
    competitors_text = json.dumps([dict(c) for c in competitors], default=str) if competitors else "N/A"
    gaps_text = json.dumps([dict(g) for g in info_gaps], default=str) if info_gaps else "N/A"

    system_prompt = (
        "You are an expert e-commerce analyst for the brand "
        f"\"{brand.get('display_name', 'Unknown')}\".\n"
        "You have access to enriched conversation intelligence data from "
        "real customer chat sessions. Answer the user's question by "
        "synthesising insights from the data provided.\n\n"
        "Be specific, cite patterns you see, mention numbers where relevant, "
        "and provide actionable recommendations.\n"
        "If the data doesn't contain enough information to answer, say so honestly.\n"
        "Format your response in clear paragraphs with bullet points where helpful."
    )

    user_prompt = (
        f"## Brand Overview\n{overview_text}\n\n"
        f"## Top Purchase Blockers\n{blockers_text}\n\n"
        f"## Top Competitors Mentioned\n{competitors_text}\n\n"
        f"## Top Unanswered Questions\n{gaps_text}\n\n"
        f"## Enriched Conversation Data ({len(relevant)} sessions)\n"
        + "\n---\n".join(conversations_text[:20])
        + f"\n\n## Question\n{question}"
    )

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.enrichment_model,
            max_tokens=2048,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        answer = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"LLM call failed: {str(e)}",
        )

    return {
        "brand_id": brand_id,
        "question": question,
        "answer": answer,
        "conversations_analyzed": len(relevant),
    }
