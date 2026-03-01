import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBrand } from '@/App';
import { fetchSessionDetail, SessionDetail } from '@/api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FileText,
  Zap,
  Bell,
  MessageSquare,
  ShoppingCart,
  ChevronRight,
  Loader2,
  PackageOpen,
  Brain,
  Bot,
  User,
} from 'lucide-react';

/* ── Timeline builder ──────────────────────────────────────────── */

interface TimelineItem {
  time: string;
  type: 'page' | 'event' | 'nudge' | 'chat' | 'order';
  title: string;
  detail?: string;
}

function buildTimeline(d: SessionDetail): TimelineItem[] {
  const items: TimelineItem[] = [];

  d.pages?.forEach((p) => {
    items.push({
      time: (p.viewed_at as string) || '',
      type: 'page',
      title: `Viewed: ${(p.page_path as string) || (p.url as string) || 'Page'}`,
      detail: p.title as string,
    });
  });

  d.events?.forEach((e) => {
    items.push({
      time: (e.timestamp as string) || (e.created_at as string) || '',
      type: 'event',
      title: `Event: ${(e.event_type as string) || (e.name as string) || 'Unknown'}`,
      detail: (e.detail as string) || (e.metadata as string) || undefined,
    });
  });

  d.interventions?.forEach((n) => {
    items.push({
      time: (n.triggered_at as string) || (n.timestamp as string) || '',
      type: 'nudge',
      title: `Nudge: ${(n.trigger_type as string) || (n.type as string) || 'Intervention'}`,
      detail: (n.message as string) || undefined,
    });
  });

  if (d.order) {
    items.push({
      time: (d.order.created_at as string) || '',
      type: 'order',
      title: 'Order Placed',
      detail: `$${((d.order.total_price as number) || 0).toLocaleString()}`,
    });
  }

  items.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return items;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; dotColor: string; bgColor: string }
> = {
  page: { icon: FileText, dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/10 dark:bg-blue-500/20' },
  event: { icon: Zap, dotColor: 'bg-purple-500', bgColor: 'bg-purple-500/10 dark:bg-purple-500/20' },
  nudge: { icon: Bell, dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/10 dark:bg-amber-500/20' },
  chat: { icon: MessageSquare, dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
  order: { icon: ShoppingCart, dotColor: 'bg-green-600', bgColor: 'bg-green-500/10 dark:bg-green-500/20' },
};

/* ── Component ─────────────────────────────────────────────────── */

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { selectedBrandId } = useBrand();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId || !sessionId) return;
    setLoading(true);
    fetchSessionDetail(selectedBrandId, sessionId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId, sessionId]);

  /* Chat messages -- normalize from object or array */
  const chatMessages: Array<Record<string, unknown>> | null =
    detail?.chat
      ? Array.isArray(detail.chat)
        ? detail.chat
        : (detail.chat as Record<string, unknown>).messages
        ? ((detail.chat as Record<string, unknown>).messages as Array<Record<string, unknown>>)
        : null
      : null;

  /* Enrichment data */
  const enrichment = detail?.enrichment as Record<string, unknown> | null;
  const personaTags: string[] =
    enrichment && Array.isArray(enrichment.persona_tags)
      ? (enrichment.persona_tags as string[])
      : enrichment && typeof enrichment.persona === 'string'
      ? [enrichment.persona as string]
      : [];
  const objections =
    enrichment && typeof enrichment.objections === 'string'
      ? (enrichment.objections as string)
      : enrichment && Array.isArray(enrichment.objections)
      ? (enrichment.objections as string[]).join(', ')
      : null;
  const sentimentScore =
    enrichment &&
    (typeof enrichment.sentiment_score === 'number' || typeof enrichment.sentiment === 'number')
      ? (enrichment.sentiment_score as number) ?? (enrichment.sentiment as number)
      : null;

  /* Order data */
  const order = detail?.order as Record<string, unknown> | null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link
          to="/sessions"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Sessions
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground font-mono text-xs">
          {sessionId?.substring(0, 16)}...
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2/3) -- Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Journey Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!detail ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No session data
                </p>
              ) : (
                (() => {
                  const items = buildTimeline(detail);
                  if (items.length === 0) {
                    return (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        No timeline events
                      </p>
                    );
                  }
                  return (
                    <ScrollArea className="max-h-[600px]">
                      <div className="relative">
                        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
                        <div className="space-y-3">
                          {items.map((item, idx) => {
                            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.event;
                            const Icon = config.icon;
                            return (
                              <div key={idx} className="relative flex gap-4 items-start">
                                <div
                                  className={cn(
                                    'w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-background',
                                    config.dotColor
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5 text-white" />
                                </div>
                                <Card className={cn('flex-1 border', config.bgColor)}>
                                  <CardContent className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-sm font-medium text-foreground">
                                        {item.title}
                                      </span>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant="outline" className="text-[10px]">
                                          {item.type}
                                        </Badge>
                                        {item.time && (
                                          <span className="text-[10px] text-muted-foreground tabular-nums">
                                            {new Date(item.time).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {item.detail && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                                        {item.detail}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3) -- Chat transcript */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!chatMessages || chatMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No chat in this session
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-3">
                    {chatMessages.map((msg, idx) => {
                      const role = (
                        (msg.role as string) ||
                        (msg.sender as string) ||
                        'unknown'
                      ).toLowerCase();
                      const content =
                        (msg.content as string) || (msg.message as string) || '';
                      const isAgent =
                        role === 'agent' || role === 'assistant' || role === 'bot';

                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex gap-2',
                            isAgent ? 'justify-start' : 'flex-row-reverse'
                          )}
                        >
                          <div
                            className={cn(
                              'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                              isAgent ? 'bg-muted' : 'bg-primary'
                            )}
                          >
                            {isAgent ? (
                              <Bot className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <User className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <div
                            className={cn(
                              'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                              isAgent
                                ? 'bg-muted text-foreground rounded-tl-sm'
                                : 'bg-primary text-primary-foreground rounded-tr-sm'
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed text-xs">
                              {content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Visitor Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Visitor Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detail?.profile ? (
                <div className="space-y-2.5 text-sm">
                  {Object.entries(detail.profile).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                      <span className="text-muted-foreground capitalize text-xs">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-foreground font-medium text-right max-w-[60%] text-xs">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No profile data
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <PackageOpen className="h-4 w-4" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order ? (
              <div className="space-y-2.5 text-sm">
                {Object.entries(order)
                  .filter(([key]) => key !== 'products')
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                      <span className="text-muted-foreground capitalize text-xs">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-foreground font-medium text-right max-w-[60%] text-xs">
                        {key.includes('price') || key.includes('total') || key.includes('amount')
                          ? `$${Number(value).toLocaleString()}`
                          : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                {order.products && Array.isArray((order as Record<string, unknown>).products) && (
                  <div className="pt-2">
                    <Separator className="mb-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-2">Products</p>
                    <div className="space-y-1">
                      {(order.products as Array<Record<string, unknown>>).map((prod, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-foreground">
                            {(prod.name as string) || (prod.title as string) || `Product ${i + 1}`}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {prod.price ? `$${Number(prod.price).toLocaleString()}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No order in this session</p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  Browse-only session
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrichment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Enrichment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrichment ? (
              <div className="space-y-4">
                {/* Persona tags */}
                {personaTags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Persona Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {personaTags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objections */}
                {objections && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Objections</p>
                    <p className="text-sm text-foreground">{objections}</p>
                  </div>
                )}

                {/* Sentiment score */}
                {sentimentScore !== null && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Sentiment Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            sentimentScore >= 0.6
                              ? 'bg-emerald-500'
                              : sentimentScore >= 0.3
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          )}
                          style={{
                            width: `${Math.min(Math.max(sentimentScore * 100, 0), 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {(sentimentScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Remaining enrichment fields */}
                <Separator />
                <div className="space-y-2 text-sm">
                  {Object.entries(enrichment)
                    .filter(
                      ([key]) =>
                        !['persona_tags', 'persona', 'objections', 'sentiment_score', 'sentiment'].includes(key)
                    )
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-muted-foreground capitalize text-xs">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-foreground font-medium text-right max-w-[60%] text-xs">
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No enrichment data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
