import { useState, useEffect } from 'react';
import { fetchSessions, fetchSessionDetail, SessionListItem, SessionDetail } from '@/api/client';
import { useBrand } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  ShoppingCart,
  X,
  FileText,
  Zap,
  Bell,
  Clock,
  Globe,
  Activity,
} from 'lucide-react';

/* ── Timeline builder (reused from SessionDetailPage) ──────── */

interface TimelineItem {
  time: string;
  type: 'page' | 'event' | 'nudge' | 'chat' | 'order';
  title: string;
  detail?: string;
}

function buildTimeline(d: SessionDetail): TimelineItem[] {
  const items: TimelineItem[] = [];

  d.pages?.forEach((p) => {
    const ts = p.page_timestamp;
    const time = typeof ts === 'number' ? new Date(ts).toISOString() : (ts as string) || '';
    items.push({
      time,
      type: 'page',
      title: `${(p.page_url as string) || 'Page'}`,
    });
  });

  d.events?.forEach((e) => {
    const ts = e.event_timestamp;
    const time = typeof ts === 'number' ? new Date(ts).toISOString() : (ts as string) || '';
    items.push({
      time,
      type: 'event',
      title: `${(e.event_name as string) || 'Unknown'}`,
      detail: (e.detail as string) || (e.metadata as string) || undefined,
    });
  });

  d.interventions?.forEach((n) => {
    items.push({
      time: (n.triggered_at as string) || '',
      type: 'nudge',
      title: `${(n.trigger_type as string) || 'Intervention'}`,
      detail: (n.nudge_text as string) || undefined,
    });
  });

  d.chat_messages?.forEach((msg) => {
    const ts = msg.created_at || msg.timestamp;
    const time = typeof ts === 'number' ? new Date(ts).toISOString() : (ts as string) || '';
    const actor = ((msg.actor as string) || 'unknown').toLowerCase();
    const isAgent = actor === 'agent' || actor === 'assistant' || actor === 'bot';
    items.push({
      time,
      type: 'chat',
      title: `${isAgent ? 'Bot' : 'Customer'}: ${((msg.message_text as string) || '').substring(0, 80)}${((msg.message_text as string) || '').length > 80 ? '...' : ''}`,
    });
  });

  if (d.order) {
    items.push({
      time: (d.order.created_at as string) || '',
      type: 'order',
      title: 'Order Placed',
      detail: `$${((d.order.subtotal_amount as number) || 0).toLocaleString()}`,
    });
  }

  items.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return items;
}

const DOT_STYLES: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  page:  { color: 'bg-blue-500',    bg: 'text-blue-400',    icon: FileText },
  event: { color: 'bg-violet-500',  bg: 'text-violet-400',  icon: Zap },
  nudge: { color: 'bg-amber-500',   bg: 'text-amber-400',   icon: Bell },
  chat:  { color: 'bg-green-500',   bg: 'text-green-400',   icon: MessageSquare },
  order: { color: 'bg-emerald-500', bg: 'text-emerald-400', icon: ShoppingCart },
};

/* ── Persona badge colors ──────────────────────────────────── */

const PERSONA_COLORS: Record<string, string> = {
  'high-intent':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'browser':         'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'comparison':      'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'deal-seeker':     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'returning':       'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'new-visitor':     'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'default':         'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

function getPersonaColor(persona: string): string {
  const key = persona.toLowerCase().replace(/[\s_]+/g, '-');
  for (const [k, v] of Object.entries(PERSONA_COLORS)) {
    if (key.includes(k)) return v;
  }
  return PERSONA_COLORS.default;
}

/* ── Component ─────────────────────────────────────────────── */

export default function SessionExplorer() {
  const { selectedBrandId } = useBrand();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterChat, setFilterChat] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchSessions(selectedBrandId, page, filterChat)
      .then((data) => {
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId, page, filterChat]);

  useEffect(() => {
    if (!selectedBrandId || !selectedSessionId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetchSessionDetail(selectedBrandId, selectedSessionId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedBrandId, selectedSessionId]);

  const timeline = detail ? buildTimeline(detail) : [];

  return (
    <div className="flex gap-6">
      {/* ── Left: Session Table ──────────────────────────────── */}
      <div className={cn('flex-1 min-w-0 space-y-4 transition-all', selectedSessionId && 'max-w-[calc(100%-404px)]')}>
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter</span>
            {[
              { label: 'All', value: undefined },
              { label: 'With Chat', value: true },
              { label: 'No Chat', value: false },
            ].map((opt) => (
              <Button
                key={opt.label}
                variant={filterChat === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilterChat(opt.value as boolean | undefined);
                  setPage(1);
                }}
                className="h-7 text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {total.toLocaleString()} sessions
          </Badge>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          {loading ? (
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          ) : sessions.length === 0 ? (
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground text-sm">No sessions found</p>
            </CardContent>
          ) : (
            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Session</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Segment</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chat</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Engagement</TableHead>
                    <TableHead className="pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => {
                    const isSelected = s.session_id === selectedSessionId;
                    const segment = (s as Record<string, unknown>).segment as string | undefined;

                    return (
                      <TableRow
                        key={s.session_id}
                        className={cn(
                          'cursor-pointer transition-colors border-border/30',
                          isSelected
                            ? 'bg-primary/5 border-l-2 border-l-primary'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() =>
                          setSelectedSessionId(isSelected ? null : s.session_id)
                        }
                      >
                        <TableCell className="pl-4 font-mono text-xs text-indigo-400">
                          {s.session_id.substring(0, 10)}...
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.synced_at
                            ? new Date(s.synced_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '--'}
                        </TableCell>
                        <TableCell>
                          {segment ? (
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] border', getPersonaColor(segment))}
                            >
                              {segment}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.has_talked_to_bot ? (
                            <MessageSquare className="h-3.5 w-3.5 text-green-400 mx-auto" />
                          ) : (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.has_placed_order ? (
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs tabular-nums border',
                              s.engagement_score >= 0.7
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : s.engagement_score >= 0.4
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                            )}
                          >
                            {s.engagement_score?.toFixed(1) ?? '--'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4 text-xs text-muted-foreground">
                          {(s as Record<string, unknown>).utm_source?.toString() || '(direct)'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={sessions.length < 50}
            onClick={() => setPage((p) => p + 1)}
            className="h-8"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Right: Timeline Panel ────────────────────────────── */}
      {selectedSessionId && (
        <div className="w-[380px] flex-shrink-0">
          <Card className="border-border/50 sticky top-6">
            {/* Panel Header */}
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Session Timeline
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedSessionId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground mt-1">
                {selectedSessionId.substring(0, 24)}...
              </p>
            </CardHeader>

            <Separator />

            {detailLoading ? (
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            ) : !detail ? (
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-muted-foreground text-xs">Failed to load session</p>
              </CardContent>
            ) : (
              <>
                {/* Summary stats */}
                <CardContent className="py-3 px-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground truncate">
                        {(detail.profile?.utm_source as string) || '(direct)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {(detail.profile?.engagement_score as number)?.toFixed(1) || '--'} eng
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {detail.pages?.length || 0} pages
                      </span>
                    </div>
                  </div>
                </CardContent>

                <Separator />

                {/* Timeline */}
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="p-4">
                      {timeline.length === 0 ? (
                        <p className="text-muted-foreground text-xs text-center py-8">
                          No timeline events
                        </p>
                      ) : (
                        <div className="relative">
                          {/* Vertical line */}
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/60" />

                          <div className="space-y-0">
                            {timeline.map((item, idx) => {
                              const style = DOT_STYLES[item.type] || DOT_STYLES.event;

                              return (
                                <div key={idx} className="relative flex gap-3 py-1.5 group">
                                  {/* Dot */}
                                  <div
                                    className={cn(
                                      'w-[15px] h-[15px] rounded-full flex-shrink-0 z-10 ring-2 ring-background mt-0.5',
                                      style.color
                                    )}
                                  />

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 pb-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs text-foreground leading-snug truncate">
                                        {item.title}
                                      </p>
                                      {item.time && (
                                        <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                                          {new Date(item.time).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      )}
                                    </div>
                                    {item.detail && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                        {item.detail}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Legend */}
                <Separator />
                <CardContent className="py-2.5 px-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {Object.entries(DOT_STYLES).map(([key, style]) => (
                      <div key={key} className="flex items-center gap-1">
                        <div className={cn('w-2 h-2 rounded-full', style.color)} />
                        <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
