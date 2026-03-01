import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Types ────────────────────────────────────────────────────── */

export interface Brand {
  id: number;
  store_domain: string;
  display_name: string;
}

export interface Overview {
  total_sessions: number;
  total_chats: number;
  total_orders: number;
  chat_rate: number;
  conversion_rate: number;
  chat_conversion_rate: number;
  avg_order_value: number;
  avg_engagement_score: number;
  returning_visitor_pct: number;
  top_objection: string | null;
  top_competitor: string | null;
}

export interface FunnelStage {
  name: string;
  count: number;
  drop_off_pct: number;
}

export interface Funnel {
  stages: FunnelStage[];
}

export interface ChannelVoC {
  utm_source: string;
  session_count: number;
  chat_count: number;
  order_count: number;
  conversion_rate: number;
  total_revenue: number;
  avg_engagement: number;
  top_objections: string[];
}

export interface Intent {
  primary_intent: string;
  secondary_intent: string;
  count: number;
  conversion_count: number;
}

export interface Objection {
  type: string;
  count: number;
  verbatim_quotes: string[];
  severity_breakdown: Record<string, number>;
  resolved_pct: number;
}

export interface NonBuyer {
  purchase_blocker: string;
  count: number;
  pct: number;
  sample_quotes: string[];
}

export interface InfoGap {
  question: string;
  frequency: number;
  agent_quality: string;
  shopper_reaction: string;
  product: string;
}

export interface Segment {
  segment_name: string;
  count: number;
  pct: number;
  conversion_rate: number;
  avg_engagement: number;
}

export interface Product {
  product_handle: string;
  view_count: number;
  unique_sessions: number;
  conversion_rate: number;
}

export interface Intervention {
  trigger_type: string;
  triggered_count: number;
  chat_after: number;
  order_after: number;
  conversion_lift: number;
}

export interface TrendPoint {
  date: string;
  sessions: number;
  chats: number;
  orders: number;
  avg_engagement: number;
}

export interface SessionListItem {
  id: number;
  session_id: string;
  engagement_score: number;
  visit_count: number;
  is_returning: boolean;
  has_talked_to_bot: boolean;
  has_placed_order: boolean;
  synced_at: string;
  scroll_percentage: number;
  time_on_page_ms: number;
  [key: string]: unknown;
}

export interface SessionsResponse {
  sessions: SessionListItem[];
  total: number;
  page: number;
}

export interface SessionDetail {
  profile: Record<string, unknown>;
  pages: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  interventions: Array<Record<string, unknown>>;
  chat: Record<string, unknown> | null;
  enrichment: Record<string, unknown> | null;
  order: Record<string, unknown> | null;
}

export interface AskResponse {
  answer: string;
  sources: Array<{ quote: string; session_id: string }>;
}

/* ── API functions ────────────────────────────────────────────── */

export const fetchBrands = () =>
  api.get('/api/brands').then((r) => r.data.brands as Brand[]);

export const fetchOverview = (brandId: number) =>
  api.get(`/api/brands/${brandId}/overview`).then((r) => {
    const d = r.data;
    return {
      ...d.kpis,
      top_objection: d.top_objection?.objection || null,
      top_competitor: d.top_competitor?.competitor_name || null,
    } as Overview;
  });

export const fetchFunnel = (brandId: number) =>
  api.get(`/api/brands/${brandId}/funnel`).then((r) => {
    const stages = r.data.stages as Array<{ stage: string; count: number }>;
    const mapped: FunnelStage[] = stages.map((s, i) => ({
      name: s.stage.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      count: s.count,
      drop_off_pct: i > 0 ? ((stages[i - 1].count - s.count) / stages[i - 1].count) * 100 : 0,
    }));
    return { stages: mapped } as Funnel;
  });

export const fetchChannelVoC = (brandId: number) =>
  api.get(`/api/brands/${brandId}/channel-voc`).then((r) => {
    const channels = r.data.channels as Array<Record<string, unknown>>;
    return channels.map((c) => ({
      utm_source: (c.utm_source as string) || 'direct',
      session_count: c.session_count as number,
      chat_count: c.chat_count as number,
      order_count: c.order_count as number,
      conversion_rate: c.conversion_rate as number,
      total_revenue: c.total_revenue as number,
      avg_engagement: (c.avg_engagement_score as number) || 0,
      top_objections: (c.top_objections as string[]) || [],
    })) as ChannelVoC[];
  });

export const fetchIntents = (brandId: number) =>
  api.get(`/api/brands/${brandId}/voc/intents`).then((r) => {
    const intents = r.data.intents as Array<Record<string, unknown>>;
    return intents.map((i) => ({
      primary_intent: i.primary_intent as string,
      secondary_intent: i.secondary_intent as string,
      count: i.intent_count as number,
      conversion_count: i.conversion_count as number,
    })) as Intent[];
  });

export const fetchObjections = (brandId: number) =>
  api.get(`/api/brands/${brandId}/voc/objections`).then((r) => {
    return (r.data.objections || []) as Objection[];
  });

export const fetchNonBuyers = (brandId: number) =>
  api.get(`/api/brands/${brandId}/voc/non-buyers`).then((r) => {
    return (r.data.blockers || []) as NonBuyer[];
  });

export const fetchInfoGaps = (brandId: number) =>
  api.get(`/api/brands/${brandId}/voc/info-gaps`).then((r) => {
    return (r.data.gaps || []) as InfoGap[];
  });

export const fetchSegments = (brandId: number) =>
  api.get(`/api/brands/${brandId}/segments`).then((r) => {
    const segs = r.data.segments as Array<Record<string, unknown>>;
    return segs.map((s) => ({
      segment_name: s.segment as string,
      count: s.session_count as number,
      pct: (s.percentage as number) * 100,
      conversion_rate: 0,
      avg_engagement: 0,
    })) as Segment[];
  });

export const fetchProducts = (brandId: number) =>
  api.get(`/api/brands/${brandId}/products`).then((r) => {
    return (r.data.products || []) as Product[];
  });

export const fetchInterventions = (brandId: number) =>
  api.get(`/api/brands/${brandId}/interventions`).then((r) => {
    const interventions = r.data.interventions as Array<Record<string, unknown>>;
    return interventions.map((i) => ({
      trigger_type: i.trigger_type as string,
      triggered_count: i.triggered_count as number,
      chat_after: i.sessions_with_subsequent_chat as number,
      order_after: i.sessions_with_order as number,
      conversion_lift: 0,
    })) as Intervention[];
  });

export const fetchTrends = (brandId: number) =>
  api.get(`/api/brands/${brandId}/trends`).then((r) => {
    return (r.data.trends || []) as TrendPoint[];
  });

export const fetchSessions = (brandId: number, page = 1, hasChat?: boolean) => {
  const params: Record<string, string | number | boolean> = { page };
  if (hasChat !== undefined) params.has_chat = hasChat;
  return api
    .get(`/api/brands/${brandId}/sessions`, { params })
    .then((r) => r.data as SessionsResponse);
};

export const fetchSessionDetail = (brandId: number, sessionId: string) =>
  api
    .get(`/api/brands/${brandId}/sessions/${sessionId}`)
    .then((r) => r.data as SessionDetail);

export const askCustomers = (brandId: number, question: string) =>
  api
    .post(`/api/brands/${brandId}/ask`, { question })
    .then((r) => r.data as AskResponse);

export default api;
