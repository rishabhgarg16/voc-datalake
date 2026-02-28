import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  top_objection: string;
  top_competitor: string;
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
  session_id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string;
  page_count: number;
  has_chat: boolean;
  has_order: boolean;
  engagement_score: number;
  utm_source: string;
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
  chat: Array<Record<string, unknown>> | null;
  enrichment: Record<string, unknown> | null;
  order: Record<string, unknown> | null;
}

export interface AskResponse {
  answer: string;
  sources: Array<{ quote: string; session_id: string }>;
}

/* ── API functions ────────────────────────────────────────────── */

export const fetchBrands = () =>
  api.get<Brand[]>('/api/brands').then((r) => r.data);

export const fetchOverview = (brandId: number) =>
  api.get<Overview>(`/api/brands/${brandId}/overview`).then((r) => r.data);

export const fetchFunnel = (brandId: number) =>
  api.get<Funnel>(`/api/brands/${brandId}/funnel`).then((r) => r.data);

export const fetchChannelVoC = (brandId: number) =>
  api.get<ChannelVoC[]>(`/api/brands/${brandId}/channel-voc`).then((r) => r.data);

export const fetchIntents = (brandId: number) =>
  api.get<Intent[]>(`/api/brands/${brandId}/voc/intents`).then((r) => r.data);

export const fetchObjections = (brandId: number) =>
  api.get<Objection[]>(`/api/brands/${brandId}/voc/objections`).then((r) => r.data);

export const fetchNonBuyers = (brandId: number) =>
  api.get<NonBuyer[]>(`/api/brands/${brandId}/voc/non-buyers`).then((r) => r.data);

export const fetchInfoGaps = (brandId: number) =>
  api.get<InfoGap[]>(`/api/brands/${brandId}/voc/info-gaps`).then((r) => r.data);

export const fetchSegments = (brandId: number) =>
  api.get<Segment[]>(`/api/brands/${brandId}/segments`).then((r) => r.data);

export const fetchProducts = (brandId: number) =>
  api.get<Product[]>(`/api/brands/${brandId}/products`).then((r) => r.data);

export const fetchInterventions = (brandId: number) =>
  api.get<Intervention[]>(`/api/brands/${brandId}/interventions`).then((r) => r.data);

export const fetchTrends = (brandId: number) =>
  api.get<TrendPoint[]>(`/api/brands/${brandId}/trends`).then((r) => r.data);

export const fetchSessions = (brandId: number, page = 1, hasChat?: boolean) => {
  const params: Record<string, string | number | boolean> = { page };
  if (hasChat !== undefined) params.has_chat = hasChat;
  return api
    .get<SessionsResponse>(`/api/brands/${brandId}/sessions`, { params })
    .then((r) => r.data);
};

export const fetchSessionDetail = (brandId: number, sessionId: string) =>
  api
    .get<SessionDetail>(`/api/brands/${brandId}/sessions/${sessionId}`)
    .then((r) => r.data);

export const askCustomers = (brandId: number, question: string) =>
  api
    .post<AskResponse>(`/api/brands/${brandId}/ask`, { question })
    .then((r) => r.data);

export default api;
