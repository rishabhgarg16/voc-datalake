-- ============================================================
-- Materialized Views for VoC Intelligence Platform
-- Run manually after data ingestion:
--   psql -f materialized_views.sql
-- Refresh with:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_<name>;
-- ============================================================

-- ============================================================
-- mv_brand_overview
-- Per-brand aggregate KPIs
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_brand_overview CASCADE;
CREATE MATERIALIZED VIEW mv_brand_overview AS
WITH session_stats AS (
    SELECT
        us.brand_id,
        COUNT(*)                                            AS total_sessions,
        AVG(us.engagement_score)                            AS avg_engagement_score,
        COUNT(*) FILTER (WHERE us.is_returning = TRUE)      AS returning_sessions
    FROM user_sessions us
    GROUP BY us.brand_id
),
chat_stats AS (
    SELECT
        cc.brand_id,
        COUNT(*)                                            AS total_chats
    FROM chat_conversations cc
    GROUP BY cc.brand_id
),
order_stats AS (
    SELECT
        o.brand_id,
        COUNT(*)                                            AS total_orders,
        AVG(o.subtotal_amount)                              AS avg_order_value
    FROM orders o
    GROUP BY o.brand_id
),
chat_conversion AS (
    -- Orders whose verifast_session matches a chat_conversation session_id
    SELECT
        o.brand_id,
        COUNT(DISTINCT o.id) AS chat_converted_orders
    FROM orders o
    JOIN chat_conversations cc
        ON cc.brand_id = o.brand_id
        AND cc.session_id = o.verifast_session
    GROUP BY o.brand_id
)
SELECT
    s.brand_id,
    s.total_sessions,
    COALESCE(c.total_chats, 0)                                             AS total_chats,
    COALESCE(o.total_orders, 0)                                            AS total_orders,
    CASE WHEN s.total_sessions > 0
         THEN ROUND(COALESCE(c.total_chats, 0)::NUMERIC / s.total_sessions, 4)
         ELSE 0 END                                                        AS chat_rate,
    CASE WHEN s.total_sessions > 0
         THEN ROUND(COALESCE(o.total_orders, 0)::NUMERIC / s.total_sessions, 4)
         ELSE 0 END                                                        AS conversion_rate,
    CASE WHEN COALESCE(c.total_chats, 0) > 0
         THEN ROUND(COALESCE(cv.chat_converted_orders, 0)::NUMERIC / c.total_chats, 4)
         ELSE 0 END                                                        AS chat_conversion_rate,
    COALESCE(o.avg_order_value, 0)                                         AS avg_order_value,
    ROUND(s.avg_engagement_score::NUMERIC, 4)                              AS avg_engagement_score,
    CASE WHEN s.total_sessions > 0
         THEN ROUND(s.returning_sessions::NUMERIC / s.total_sessions, 4)
         ELSE 0 END                                                        AS returning_visitor_pct
FROM session_stats s
LEFT JOIN chat_stats c       ON c.brand_id = s.brand_id
LEFT JOIN order_stats o      ON o.brand_id = s.brand_id
LEFT JOIN chat_conversion cv ON cv.brand_id = s.brand_id;

CREATE UNIQUE INDEX ON mv_brand_overview (brand_id);


-- ============================================================
-- mv_conversion_funnel
-- Per-brand funnel stage counts
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_conversion_funnel CASCADE;
CREATE MATERIALIZED VIEW mv_conversion_funnel AS
WITH visited AS (
    SELECT brand_id, COUNT(*) AS cnt
    FROM user_sessions
    GROUP BY brand_id
),
viewed_product AS (
    SELECT us.brand_id, COUNT(DISTINCT us.id) AS cnt
    FROM user_sessions us
    JOIN session_pages sp ON sp.session_id = us.id
    WHERE sp.product_handle IS NOT NULL
    GROUP BY us.brand_id
),
engaged AS (
    SELECT us.brand_id, COUNT(DISTINCT us.id) AS cnt
    FROM user_sessions us
    JOIN session_pages sp ON sp.session_id = us.id
    WHERE us.scroll_percentage > 0.5 OR us.time_on_page_ms > 30000
    GROUP BY us.brand_id
),
chatted AS (
    SELECT us.brand_id, COUNT(DISTINCT us.id) AS cnt
    FROM user_sessions us
    JOIN chat_conversations cc
        ON cc.session_id = us.session_id AND cc.brand_id = us.brand_id
    GROUP BY us.brand_id
),
ordered AS (
    SELECT us.brand_id, COUNT(DISTINCT us.id) AS cnt
    FROM user_sessions us
    JOIN orders o
        ON o.verifast_session = us.session_id AND o.brand_id = us.brand_id
    GROUP BY us.brand_id
)
SELECT
    v.brand_id,
    v.cnt   AS visited,
    COALESCE(vp.cnt, 0) AS viewed_product,
    COALESCE(e.cnt, 0)  AS engaged,
    COALESCE(ch.cnt, 0) AS chatted,
    COALESCE(ord.cnt, 0) AS ordered
FROM visited v
LEFT JOIN viewed_product vp ON vp.brand_id = v.brand_id
LEFT JOIN engaged e         ON e.brand_id  = v.brand_id
LEFT JOIN chatted ch        ON ch.brand_id = v.brand_id
LEFT JOIN ordered ord       ON ord.brand_id = v.brand_id;

CREATE UNIQUE INDEX ON mv_conversion_funnel (brand_id);


-- ============================================================
-- mv_utm_attribution
-- Per brand, per utm_source
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_utm_attribution CASCADE;
CREATE MATERIALIZED VIEW mv_utm_attribution AS
SELECT
    us.brand_id,
    COALESCE(sp.utm_source, 'direct')                       AS utm_source,
    COUNT(DISTINCT us.id)                                   AS session_count,
    COUNT(DISTINCT cc.id)                                   AS chat_count,
    COUNT(DISTINCT o.id)                                    AS order_count,
    CASE WHEN COUNT(DISTINCT us.id) > 0
         THEN ROUND(COUNT(DISTINCT o.id)::NUMERIC / COUNT(DISTINCT us.id), 4)
         ELSE 0 END                                         AS conversion_rate,
    COALESCE(SUM(DISTINCT o.subtotal_amount), 0)            AS total_revenue,
    ROUND(AVG(us.engagement_score)::NUMERIC, 4)             AS avg_engagement_score
FROM user_sessions us
JOIN session_pages sp ON sp.session_id = us.id
LEFT JOIN chat_conversations cc
    ON cc.session_id = us.session_id AND cc.brand_id = us.brand_id
LEFT JOIN orders o
    ON o.verifast_session = us.session_id AND o.brand_id = us.brand_id
GROUP BY us.brand_id, COALESCE(sp.utm_source, 'direct');

CREATE UNIQUE INDEX ON mv_utm_attribution (brand_id, utm_source);


-- ============================================================
-- mv_intent_distribution
-- Per brand, per primary_intent, secondary_intent
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_intent_distribution CASCADE;
CREATE MATERIALIZED VIEW mv_intent_distribution AS
SELECT
    cc.brand_id,
    ci.primary_intent,
    ci.secondary_intent,
    COUNT(*)                                                AS intent_count,
    COUNT(DISTINCT o.id)                                    AS conversion_count
FROM chat_intents ci
JOIN chat_conversations cc ON cc.id = ci.conversation_id
LEFT JOIN orders o
    ON o.verifast_session = cc.session_id AND o.brand_id = cc.brand_id
GROUP BY cc.brand_id, ci.primary_intent, ci.secondary_intent;

CREATE UNIQUE INDEX ON mv_intent_distribution (brand_id, primary_intent, secondary_intent);


-- ============================================================
-- mv_daily_trends
-- Per brand, per day
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_daily_trends CASCADE;
CREATE MATERIALIZED VIEW mv_daily_trends AS
WITH daily_sessions AS (
    SELECT
        brand_id,
        DATE(TO_TIMESTAMP(website_landed_time / 1000)) AS day,
        COUNT(*)           AS sessions,
        AVG(engagement_score) AS avg_engagement
    FROM user_sessions
    WHERE website_landed_time IS NOT NULL
    GROUP BY brand_id, DATE(TO_TIMESTAMP(website_landed_time / 1000))
),
daily_chats AS (
    SELECT
        brand_id,
        DATE(first_message_at) AS day,
        COUNT(*) AS chats
    FROM chat_conversations
    WHERE first_message_at IS NOT NULL
    GROUP BY brand_id, DATE(first_message_at)
),
daily_orders AS (
    SELECT
        brand_id,
        DATE(created_at) AS day,
        COUNT(*) AS orders
    FROM orders
    WHERE created_at IS NOT NULL
    GROUP BY brand_id, DATE(created_at)
)
SELECT
    ds.brand_id,
    ds.day,
    ds.sessions,
    COALESCE(dc.chats, 0)   AS chats,
    COALESCE(do2.orders, 0)  AS orders,
    ROUND(ds.avg_engagement::NUMERIC, 4) AS avg_engagement
FROM daily_sessions ds
LEFT JOIN daily_chats dc   ON dc.brand_id = ds.brand_id AND dc.day = ds.day
LEFT JOIN daily_orders do2 ON do2.brand_id = ds.brand_id AND do2.day = ds.day;

CREATE UNIQUE INDEX ON mv_daily_trends (brand_id, day);


-- ============================================================
-- mv_product_interest
-- Per brand, per product_handle
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_product_interest CASCADE;
CREATE MATERIALIZED VIEW mv_product_interest AS
SELECT
    us.brand_id,
    sp.product_handle,
    COUNT(*)                                                AS view_count,
    COUNT(DISTINCT us.id)                                   AS unique_sessions,
    COUNT(DISTINCT o.id)                                    AS sessions_with_order,
    CASE WHEN COUNT(DISTINCT us.id) > 0
         THEN ROUND(COUNT(DISTINCT o.id)::NUMERIC / COUNT(DISTINCT us.id), 4)
         ELSE 0 END                                         AS conversion_rate
FROM session_pages sp
JOIN user_sessions us ON us.id = sp.session_id
LEFT JOIN orders o
    ON o.verifast_session = us.session_id AND o.brand_id = us.brand_id
WHERE sp.product_handle IS NOT NULL
GROUP BY us.brand_id, sp.product_handle;

CREATE UNIQUE INDEX ON mv_product_interest (brand_id, product_handle);


-- ============================================================
-- mv_intervention_effectiveness
-- Per brand, per trigger_type
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_intervention_effectiveness CASCADE;
CREATE MATERIALIZED VIEW mv_intervention_effectiveness AS
SELECT
    us.brand_id,
    si.trigger_type,
    COUNT(DISTINCT si.id)                                   AS triggered_count,
    COUNT(DISTINCT cc.id)                                   AS sessions_with_subsequent_chat,
    COUNT(DISTINCT o.id)                                    AS sessions_with_order
FROM session_interventions si
JOIN user_sessions us ON us.id = si.session_id
LEFT JOIN chat_conversations cc
    ON cc.session_id = us.session_id AND cc.brand_id = us.brand_id
LEFT JOIN orders o
    ON o.verifast_session = us.session_id AND o.brand_id = us.brand_id
GROUP BY us.brand_id, si.trigger_type;

CREATE UNIQUE INDEX ON mv_intervention_effectiveness (brand_id, trigger_type);
