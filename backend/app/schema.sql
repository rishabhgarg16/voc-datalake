CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- LAYER 1: Multi-tenant brand registry
-- ============================================================
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  store_domain TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LAYER 2: Behavioral sessions (from user_profiling.json)
-- ============================================================
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES brands(id),
  session_id TEXT NOT NULL,
  -- Engagement
  scroll_position FLOAT,
  scroll_percentage FLOAT,
  scroll_direction TEXT,
  mouse_speed FLOAT,
  time_on_page_ms BIGINT,
  -- Device
  user_agent TEXT,
  browser_language TEXT,
  -- Permanent profile
  visited_days TEXT[],
  visit_count INT,
  event_count INT,
  has_talked_to_bot BOOLEAN,
  has_placed_order BOOLEAN,
  -- Timestamps
  website_landed_time BIGINT,
  last_activity BIGINT,
  synced_at TIMESTAMPTZ,
  -- Computed
  engagement_score FLOAT,
  is_returning BOOLEAN,
  UNIQUE(brand_id, session_id)
);

CREATE INDEX idx_user_sessions_brand ON user_sessions(brand_id);
CREATE INDEX idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_engagement ON user_sessions(brand_id, engagement_score DESC);

CREATE TABLE session_pages (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES user_sessions(id) ON DELETE CASCADE,
  page_url TEXT,
  page_timestamp BIGINT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  product_handle TEXT,
  collection_handle TEXT
);

CREATE INDEX idx_session_pages_session ON session_pages(session_id);
CREATE INDEX idx_session_pages_product ON session_pages(product_handle) WHERE product_handle IS NOT NULL;

CREATE TABLE session_events (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES user_sessions(id) ON DELETE CASCADE,
  event_name TEXT,
  event_timestamp BIGINT
);

CREATE INDEX idx_session_events_session ON session_events(session_id);

CREATE TABLE session_interventions (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES user_sessions(id) ON DELETE CASCADE,
  trigger_type TEXT,
  action_type TEXT,
  nudge_text TEXT,
  nudge_variant TEXT,
  buttons TEXT[],
  triggered_at BIGINT,
  ttl INT
);

CREATE INDEX idx_session_interventions_session ON session_interventions(session_id);

-- ============================================================
-- LAYER 3: Chat conversations (from chat.json)
-- ============================================================
CREATE TABLE chat_conversations (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES brands(id),
  session_id TEXT NOT NULL,
  message_count INT,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  -- Customer metadata
  customer_ip TEXT,
  customer_location TEXT,
  device_os TEXT,
  device_is_mobile BOOLEAN,
  device_browser TEXT,
  screen_size TEXT,
  -- PII
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  past_orders_count INT,
  total_spent DECIMAL(10,2),
  has_placed_order BOOLEAN,
  nudge_trigger TEXT,
  bot_page TEXT,
  session_number INT
);

CREATE INDEX idx_chat_conversations_brand ON chat_conversations(brand_id);
CREATE INDEX idx_chat_conversations_session ON chat_conversations(session_id);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES chat_conversations(id) ON DELETE CASCADE,
  actor TEXT,
  message_text TEXT,
  created_at TIMESTAMPTZ,
  message_order INT
);

CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id);

CREATE TABLE chat_intents (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES chat_conversations(id) ON DELETE CASCADE,
  primary_intent TEXT,
  secondary_intent TEXT,
  created_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_intents_conv ON chat_intents(conversation_id);
CREATE INDEX idx_chat_intents_primary ON chat_intents(primary_intent);

-- ============================================================
-- LAYER 4: Orders (from order_data.json)
-- ============================================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES brands(id),
  shopify_order_id TEXT,
  order_name TEXT,
  created_at TIMESTAMPTZ,
  subtotal_amount DECIMAL(10,2),
  currency TEXT,
  email TEXT,
  phone TEXT,
  client_ip TEXT,
  discount_codes TEXT[],
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  verifast_session TEXT,
  user_agent TEXT,
  landing_url TEXT,
  UNIQUE(brand_id, shopify_order_id)
);

CREATE INDEX idx_orders_brand ON orders(brand_id);
CREATE INDEX idx_orders_session ON orders(verifast_session);
CREATE INDEX idx_orders_utm ON orders(brand_id, utm_source);

CREATE TABLE order_line_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  shopify_product_id TEXT,
  product_name TEXT,
  quantity INT
);

CREATE INDEX idx_order_items_order ON order_line_items(order_id);

-- ============================================================
-- LAYER 5: LLM-Enriched Intelligence
-- ============================================================
CREATE TABLE enriched_conversations (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES chat_conversations(id) UNIQUE,
  brand_id INT REFERENCES brands(id),
  session_id TEXT NOT NULL,
  -- Purchase outcome (stitched)
  outcome TEXT,
  -- LLM-extracted
  primary_intent TEXT,
  purchase_readiness TEXT,
  price_sensitivity TEXT,
  knowledge_level TEXT,
  -- Structured JSONB fields
  objections JSONB DEFAULT '[]',
  competitor_mentions JSONB DEFAULT '[]',
  product_feedback JSONB DEFAULT '[]',
  information_gaps JSONB DEFAULT '[]',
  demand_signals JSONB DEFAULT '[]',
  -- Sentiment
  sentiment_score FLOAT,
  sentiment_trajectory TEXT,
  emotional_state TEXT,
  -- Persona
  persona_tags TEXT[] DEFAULT '{}',
  purchase_blockers TEXT[] DEFAULT '{}',
  -- Embedding for semantic search
  embedding VECTOR(1536),
  -- Metadata
  enrichment_model TEXT,
  enrichment_version INT DEFAULT 1,
  enriched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enriched_brand ON enriched_conversations(brand_id);
CREATE INDEX idx_enriched_session ON enriched_conversations(session_id);
CREATE INDEX idx_enriched_intent ON enriched_conversations(primary_intent);
CREATE INDEX idx_enriched_sentiment ON enriched_conversations(brand_id, sentiment_score);

-- Dedicated competitor mentions (denormalized for fast queries)
CREATE TABLE competitor_mentions (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES brands(id),
  conversation_id INT REFERENCES chat_conversations(id),
  session_id TEXT,
  competitor_name TEXT NOT NULL,
  mention_context TEXT,
  sentiment_vs_brand TEXT,
  verbatim_quote TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitor_brand ON competitor_mentions(brand_id);
CREATE INDEX idx_competitor_name ON competitor_mentions(brand_id, competitor_name);

-- Information gaps tracking
CREATE TABLE information_gaps (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES brands(id),
  conversation_id INT REFERENCES chat_conversations(id),
  customer_question TEXT NOT NULL,
  agent_response_quality TEXT,
  shopper_reaction TEXT,
  product_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_info_gaps_brand ON information_gaps(brand_id);

-- Shopper personas
CREATE TABLE shopper_personas (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES brands(id),
  persona_name TEXT NOT NULL,
  persona_description TEXT,
  identifying_signals JSONB,
  avg_conversion_rate FLOAT,
  avg_message_count FLOAT,
  pct_of_shoppers FLOAT,
  recommended_approach TEXT,
  sample_session_ids TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);
