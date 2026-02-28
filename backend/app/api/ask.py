import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import anthropic

from app.config import settings
from app.db import fetch_all, fetch_one

router = APIRouter(tags=["ask"])


class AskRequest(BaseModel):
    question: str


@router.post("/brands/{brand_id}/ask")
async def ask_customers(brand_id: int, body: AskRequest):
    brand = await fetch_one(
        "SELECT id, display_name FROM brands WHERE id = $1", brand_id
    )
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured",
        )

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Search enriched conversations for relevant data using text matching
    # on JSONB fields (objections, product_feedback) and text columns
    relevant = await fetch_all(
        """
        SELECT
            ec.session_id,
            ec.outcome,
            ec.primary_intent,
            ec.purchase_readiness,
            ec.price_sensitivity,
            ec.objections,
            ec.competitor_mentions,
            ec.product_feedback,
            ec.information_gaps,
            ec.demand_signals,
            ec.sentiment_score,
            ec.emotional_state,
            ec.persona_tags,
            ec.purchase_blockers
        FROM enriched_conversations ec
        WHERE ec.brand_id = $1
          AND (
              ec.objections::text ILIKE '%' || $2 || '%'
              OR ec.product_feedback::text ILIKE '%' || $2 || '%'
              OR ec.competitor_mentions::text ILIKE '%' || $2 || '%'
              OR ec.information_gaps::text ILIKE '%' || $2 || '%'
              OR ec.demand_signals::text ILIKE '%' || $2 || '%'
              OR ec.primary_intent ILIKE '%' || $2 || '%'
              OR array_to_string(ec.purchase_blockers, ',') ILIKE '%' || $2 || '%'
              OR array_to_string(ec.persona_tags, ',') ILIKE '%' || $2 || '%'
          )
        LIMIT 30
        """,
        brand_id,
        question,
    )

    # If text search yields too few results, fall back to a broader sample
    if len(relevant) < 5:
        fallback = await fetch_all(
            """
            SELECT
                ec.session_id,
                ec.outcome,
                ec.primary_intent,
                ec.purchase_readiness,
                ec.price_sensitivity,
                ec.objections,
                ec.competitor_mentions,
                ec.product_feedback,
                ec.information_gaps,
                ec.demand_signals,
                ec.sentiment_score,
                ec.emotional_state,
                ec.persona_tags,
                ec.purchase_blockers
            FROM enriched_conversations ec
            WHERE ec.brand_id = $1
            ORDER BY ec.enriched_at DESC
            LIMIT 30
            """,
            brand_id,
        )
        # Merge, avoiding duplicates
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
            "objections": r["objections"] if isinstance(r["objections"], list) else json.loads(r["objections"]) if r["objections"] else [],
            "competitors": r["competitor_mentions"] if isinstance(r["competitor_mentions"], list) else json.loads(r["competitor_mentions"]) if r["competitor_mentions"] else [],
            "feedback": r["product_feedback"] if isinstance(r["product_feedback"], list) else json.loads(r["product_feedback"]) if r["product_feedback"] else [],
            "info_gaps": r["information_gaps"] if isinstance(r["information_gaps"], list) else json.loads(r["information_gaps"]) if r["information_gaps"] else [],
            "demand_signals": r["demand_signals"] if isinstance(r["demand_signals"], list) else json.loads(r["demand_signals"]) if r["demand_signals"] else [],
            "blockers": r["purchase_blockers"],
            "persona": r["persona_tags"],
        }
        conversations_text.append(json.dumps(entry, default=str))

    overview_text = json.dumps(overview, default=str) if overview else "N/A"

    system_prompt = (
        "You are an expert e-commerce analyst for the brand "
        f"\"{brand.get('display_name', 'Unknown')}\".\n"
        "You have access to enriched conversation intelligence data from "
        "real customer chat sessions. Answer the user's question by "
        "synthesising insights from the data provided.\n\n"
        "Be specific, cite patterns you see, mention numbers where relevant, "
        "and provide actionable recommendations.\n"
        "If the data doesn't contain enough information to answer, say so honestly."
    )

    user_prompt = (
        f"## Brand Overview\n{overview_text}\n\n"
        f"## Enriched Conversation Data ({len(relevant)} sessions)\n"
        + "\n---\n".join(conversations_text)
        + f"\n\n## Question\n{question}"
    )

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        answer = response.content[0].text
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
