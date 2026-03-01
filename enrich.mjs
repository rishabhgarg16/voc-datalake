/**
 * VoC Enrichment Worker (Node.js)
 * Processes chat conversations through OpenAI GPT-4o-mini to extract
 * structured intelligence: objections, competitors, sentiment, personas, etc.
 */
import OpenAI from "openai";
import pg from "pg";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = "postgresql://voc:voc_secret@localhost:5432/voc_datalake";
const CONCURRENCY = 10;
const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are an e-commerce conversation analyst. Given a chat transcript between an AI shopping assistant and a customer, extract structured intelligence.

Return ONLY valid JSON with these fields:
{
  "summary": "1-2 sentence summary of the conversation",
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "purchase_blockers": ["list of reasons the customer might not buy, e.g. 'price too high', 'wants COD', 'unsure about ingredients'"],
  "objections": ["specific objections raised, e.g. 'too expensive', 'found cheaper alternative'"],
  "competitor_mentions": [{"name": "competitor name", "context": "what was said about them"}],
  "information_gaps": ["questions the AI could not answer well or gave generic responses to"],
  "demand_signals": ["products or features the customer wanted but don't exist"],
  "persona_tags": ["2-3 tags like 'deal_hunter', 'ingredient_conscious', 'gift_buyer', 'returning_customer', 'impulse_buyer', 'research_oriented'"],
  "primary_intent": "main reason for chatting",
  "key_products_discussed": ["product names mentioned"],
  "urgency_level": "high" | "medium" | "low"
}`;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function getUnenrichedConversations() {
  const result = await pool.query(`
    SELECT cc.id, cc.session_id, cc.customer_location, cc.customer_email,
           cc.past_orders_count, cc.nudge_trigger, cc.bot_page
    FROM chat_conversations cc
    LEFT JOIN enriched_conversations ec ON ec.conversation_id = cc.id
    WHERE ec.id IS NULL
    ORDER BY cc.id
  `);
  return result.rows;
}

async function getMessages(convId) {
  const result = await pool.query(
    `SELECT actor, message_text FROM chat_messages WHERE conversation_id = $1 ORDER BY message_order`,
    [convId]
  );
  return result.rows;
}

async function getIntents(convId) {
  const result = await pool.query(
    `SELECT primary_intent, secondary_intent FROM chat_intents WHERE conversation_id = $1`,
    [convId]
  );
  return result.rows;
}

async function checkOrder(sessionId) {
  const result = await pool.query(
    `SELECT order_name, subtotal_amount FROM orders WHERE verifast_session = $1 LIMIT 1`,
    [sessionId]
  );
  return result.rows[0] || null;
}

async function saveEnrichment(convId, brandId, enrichment) {
  // Save main enrichment
  await pool.query(
    `INSERT INTO enriched_conversations
     (conversation_id, brand_id, summary, sentiment, purchase_blockers,
      persona_tags, primary_intent_enriched, urgency_level, demand_signals)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (conversation_id) DO NOTHING`,
    [
      convId, brandId,
      enrichment.summary || "",
      enrichment.sentiment || "neutral",
      enrichment.purchase_blockers || [],
      enrichment.persona_tags || [],
      enrichment.primary_intent || "",
      enrichment.urgency_level || "medium",
      enrichment.demand_signals || [],
    ]
  );

  // Save competitor mentions
  if (enrichment.competitor_mentions?.length) {
    for (const cm of enrichment.competitor_mentions) {
      if (cm.name) {
        await pool.query(
          `INSERT INTO competitor_mentions (conversation_id, brand_id, competitor_name, context, sentiment)
           VALUES ($1, $2, $3, $4, $5)`,
          [convId, brandId, cm.name, cm.context || "", enrichment.sentiment || "neutral"]
        );
      }
    }
  }

  // Save information gaps
  if (enrichment.information_gaps?.length) {
    for (const gap of enrichment.information_gaps) {
      await pool.query(
        `INSERT INTO information_gaps (conversation_id, brand_id, question_asked, ai_response_quality)
         VALUES ($1, $2, $3, $4)`,
        [convId, brandId, gap, "poor"]
      );
    }
  }

  // Save objections
  if (enrichment.objections?.length) {
    for (const obj of enrichment.objections) {
      await pool.query(
        `INSERT INTO enriched_conversations (conversation_id, brand_id, summary, sentiment, purchase_blockers, persona_tags, primary_intent_enriched, urgency_level, demand_signals)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (conversation_id) DO NOTHING`,
        [convId, brandId, enrichment.summary, enrichment.sentiment, [obj], [], "", "medium", []]
      ).catch(() => {}); // Already inserted above, skip duplicates
    }
  }
}

async function enrichOne(conv, index, total) {
  try {
    const messages = await getMessages(conv.id);
    const intents = await getIntents(conv.id);
    const order = await checkOrder(conv.session_id);

    if (messages.length === 0) {
      console.log(`  [${index}/${total}] Skip ${conv.session_id} - no messages`);
      return;
    }

    const transcript = messages
      .map((m) => `${m.actor === "AI" ? "Assistant" : "Customer"}: ${m.message_text}`)
      .join("\n");

    const intentStr = intents.length
      ? `Known intents: ${intents.map((i) => `${i.primary_intent}/${i.secondary_intent}`).join(", ")}`
      : "";

    const outcome = order
      ? `Outcome: PURCHASED (order ${order.order_name}, ₹${order.subtotal_amount})`
      : "Outcome: DID NOT PURCHASE";

    const userPrompt = `${intentStr}
${outcome}
Customer location: ${conv.customer_location || "unknown"}
Past orders: ${conv.past_orders_count || 0}
Nudge trigger: ${conv.nudge_trigger || "none"}
Page: ${conv.bot_page || "unknown"}

TRANSCRIPT:
${transcript}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    let raw = response.choices[0].message.content.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    }

    const enrichment = JSON.parse(raw);

    // Get brand_id
    const brandResult = await pool.query(
      `SELECT brand_id FROM chat_conversations WHERE id = $1`,
      [conv.id]
    );
    const brandId = brandResult.rows[0]?.brand_id || 1;

    await saveEnrichment(conv.id, brandId, enrichment);

    const blockers = enrichment.purchase_blockers?.length || 0;
    const competitors = enrichment.competitor_mentions?.length || 0;
    console.log(
      `  [${index}/${total}] ✓ ${conv.session_id} | ${enrichment.sentiment} | ${blockers} blockers | ${competitors} competitors | ${enrichment.persona_tags?.join(", ") || "no tags"}`
    );
  } catch (err) {
    console.error(`  [${index}/${total}] ✗ ${conv.session_id}: ${err.message}`);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("VoC Enrichment Worker (Node.js + GPT-4o-mini)");
  console.log("=".repeat(60));

  if (!OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not set");
    process.exit(1);
  }

  const conversations = await getUnenrichedConversations();
  console.log(`Found ${conversations.length} un-enriched conversations`);

  if (conversations.length === 0) {
    console.log("Nothing to enrich. Done.");
    await pool.end();
    return;
  }

  // Process in batches with concurrency limit
  let processed = 0;
  for (let i = 0; i < conversations.length; i += CONCURRENCY) {
    const batch = conversations.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((conv, j) => enrichOne(conv, i + j + 1, conversations.length))
    );
    processed += batch.length;
    console.log(`--- Batch complete: ${processed}/${conversations.length} ---`);
  }

  console.log("=".repeat(60));
  console.log(`Enrichment complete. Processed ${processed} conversations.`);

  // Print summary stats
  const stats = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
      COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative,
      COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
      COUNT(CASE WHEN sentiment = 'mixed' THEN 1 END) as mixed
    FROM enriched_conversations
  `);
  console.log("Sentiment breakdown:", stats.rows[0]);

  const compCount = await pool.query(`SELECT COUNT(*) as c FROM competitor_mentions`);
  console.log("Competitor mentions:", compCount.rows[0].c);

  const gapCount = await pool.query(`SELECT COUNT(*) as c FROM information_gaps`);
  console.log("Information gaps:", gapCount.rows[0].c);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
