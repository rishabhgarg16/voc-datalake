import { useState, useEffect, useMemo } from 'react';
import { useBrand } from '@/App';
import {
  fetchObjections,
  fetchInfoGaps,
  fetchIntents,
  Objection,
  InfoGap,
  Intent,
} from '@/api/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  MessageSquareWarning,
  ShieldAlert,
  Search,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

/* ── VoC Page (Non-Buyer Intelligence) ────────────────────────── */

export default function VoCPage() {
  const { selectedBrandId } = useBrand();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [infoGaps, setInfoGaps] = useState<InfoGap[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    Promise.all([
      fetchObjections(selectedBrandId),
      fetchInfoGaps(selectedBrandId),
      fetchIntents(selectedBrandId),
    ])
      .then(([obj, ig, int]) => {
        setObjections(obj);
        setInfoGaps(ig);
        setIntents(int);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  /* derived stats */
  const totalChats = useMemo(() => {
    const total = objections.reduce((s, o) => s + o.mention_count, 0);
    return total > 0 ? total : 0;
  }, [objections]);

  const totalBlockers = objections.length;

  const nonBuyerConversations = useMemo(() => {
    const nb = objections.reduce(
      (s, o) => s + (o.mention_count - o.converted_count),
      0
    );
    return nb > 0 ? nb : 0;
  }, [objections]);

  const recoverableRevenue = useMemo(() => {
    const val = nonBuyerConversations * 65;
    return val > 0 ? val : 0;
  }, [nonBuyerConversations]);

  const maxMentionCount = useMemo(
    () => Math.max(...objections.map((o) => o.mention_count), 1),
    [objections]
  );

  /* ── Loading skeleton ──────────────────────────────────────── */
  const TableSkeleton = () => (
    <Card className="animate-pulse border-border/60">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/6" />
        </div>
      </CardContent>
    </Card>
  );

  /* ── Empty state ───────────────────────────────────────────── */
  const EmptyState = ({ message }: { message: string }) => (
    <Card className="border-border/60">
      <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Badge variant="secondary" className="text-xs">
          Run LLM enrichment to populate
        </Badge>
      </CardContent>
    </Card>
  );

  /* ── Severity helpers ──────────────────────────────────────── */
  const severityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const barColor = (severity: string) =>
    severity.toLowerCase() === 'high' ? 'bg-rose-500' : 'bg-amber-500';

  const qualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'unanswered':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'partial':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'good':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-0">
      {/* ── Gradient Header Section ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-rose-50 via-rose-100/50 to-rose-50 dark:from-background dark:via-rose-950/30 dark:to-background -mx-6 -mt-6 px-6 pt-6 pb-8 mb-6 rounded-b-xl border-b border-rose-200 dark:border-rose-500/10">
        {/* Killer Feature badge */}
        <div className="mb-4">
          <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5">
            <ShieldAlert className="h-3 w-3 mr-1.5" />
            Killer Feature
          </Badge>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Non-Buyer Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Understand why visitors are not converting and what blocks purchases.
          Surface the objections, information gaps, and intents that drive
          drop-off.
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatCard
            icon={<MessageSquareWarning className="h-4 w-4 text-rose-400" />}
            value={totalChats.toLocaleString()}
            label="Chats Analyzed"
          />
          <StatCard
            icon={<TrendingDown className="h-4 w-4 text-amber-400" />}
            value={nonBuyerConversations.toLocaleString()}
            label="Non-Buyer Conversations"
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
            value={totalBlockers.toString()}
            label="Blockers Found"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            value={`$${recoverableRevenue.toLocaleString()}`}
            label="Recoverable Revenue (est.)"
          />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="objections" className="space-y-4">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="objections" className="gap-1.5 data-[state=active]:bg-muted">
            <ShieldAlert className="h-3.5 w-3.5" />
            Objections
            {objections.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {objections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="infogaps" className="gap-1.5 data-[state=active]:bg-muted">
            <Search className="h-3.5 w-3.5" />
            Info Gaps
            {infoGaps.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {infoGaps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="intents" className="gap-1.5 data-[state=active]:bg-muted">
            <TrendingUp className="h-3.5 w-3.5" />
            Intents
            {intents.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {intents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Objections tab — Expandable Blocker Cards ───────────── */}
        <TabsContent value="objections">
          {loading ? (
            <TableSkeleton />
          ) : objections.length === 0 ? (
            <EmptyState message="No objection data available" />
          ) : (
            <div className="space-y-3">
              {objections.map((obj, idx) => {
                const isExpanded = expandedIdx === idx;
                const freqPct = (obj.mention_count / maxMentionCount) * 100;
                return (
                  <Card
                    key={idx}
                    className={cn(
                      'border-border/60 transition-all duration-200 cursor-pointer hover:border-muted-foreground/30',
                      isExpanded && 'border-muted-foreground/20 ring-1 ring-muted-foreground/10'
                    )}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <CardContent className="p-0">
                      {/* Collapsed row */}
                      <div className="flex items-center gap-4 px-5 py-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground font-mono">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Objection name + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {obj.objection}
                            </p>
                            <Badge
                              className={cn(
                                'text-[10px] uppercase tracking-wider border flex-shrink-0',
                                severityColor(obj.severity)
                              )}
                            >
                              {obj.severity}
                            </Badge>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                barColor(obj.severity)
                              )}
                              style={{ width: `${freqPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Mention count */}
                        <div className="flex-shrink-0 text-right">
                          <span className="text-lg font-mono font-bold text-foreground tabular-nums">
                            {obj.mention_count}
                          </span>
                          <p className="text-[10px] text-muted-foreground">mentions</p>
                        </div>

                        {/* Trend indicator */}
                        <div className="flex-shrink-0">
                          {obj.severity === 'high' ? (
                            <TrendingUp className="h-4 w-4 text-rose-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-amber-400" />
                          )}
                        </div>

                        {/* Expand chevron */}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-0 border-t border-border/60">
                          <div className="pt-4 space-y-3">
                            <p className="text-sm text-muted-foreground">
                              This objection was mentioned{' '}
                              <span className="text-foreground font-medium">
                                {obj.mention_count} times
                              </span>{' '}
                              across conversations.
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                  Mentions
                                </p>
                                <p className="text-lg font-mono font-bold text-foreground">
                                  {obj.mention_count}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                  Resolved
                                </p>
                                <p className="text-lg font-mono font-bold text-emerald-400">
                                  {obj.resolved_count}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                  Converted
                                </p>
                                <p className="text-lg font-mono font-bold text-blue-400">
                                  {obj.converted_count}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Info Gaps tab ─────────────────────────────────────── */}
        <TabsContent value="infogaps">
          {loading ? (
            <TableSkeleton />
          ) : infoGaps.length === 0 ? (
            <EmptyState message="No info gap data available" />
          ) : (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  Information Gaps
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="pl-6">Question</TableHead>
                      <TableHead className="text-right">Frequency</TableHead>
                      <TableHead>Agent Quality</TableHead>
                      <TableHead>Shopper Reaction</TableHead>
                      <TableHead className="pr-6">Product</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {infoGaps.map((gap, idx) => (
                      <TableRow key={idx} className="border-border/60">
                        <TableCell className="pl-6 font-medium text-foreground max-w-sm">
                          {gap.customer_question}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-mono">
                          {gap.frequency.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-[10px] uppercase tracking-wider border',
                              qualityColor(gap.agent_response_quality)
                            )}
                          >
                            {gap.agent_response_quality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {gap.most_common_reaction}
                        </TableCell>
                        <TableCell className="pr-6 text-muted-foreground text-sm">
                          {gap.most_common_product || '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Intents tab ──────────────────────────────────────── */}
        <TabsContent value="intents">
          {loading ? (
            <TableSkeleton />
          ) : intents.length === 0 ? (
            <EmptyState message="No intent data available" />
          ) : (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  Intent Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="pl-6">Intent</TableHead>
                      <TableHead>Sub-Intent</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right pr-6">Conv Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intents.map((intent, idx) => {
                      const convRate =
                        intent.count > 0
                          ? ((intent.conversion_count / intent.count) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <TableRow key={idx} className="border-border/60">
                          <TableCell className="pl-6 font-medium text-foreground">
                            {intent.primary_intent}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {intent.secondary_intent || '--'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-mono">
                            {intent.count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-mono">
                            {intent.conversion_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge
                              variant={
                                parseFloat(convRate) >= 5
                                  ? 'default'
                                  : parseFloat(convRate) >= 2
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs tabular-nums"
                            >
                              {convRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Stat card sub-component ─────────────────────────────────── */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-card/60 border border-border rounded-lg px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1.5">{icon}</div>
      <p className="text-xl font-mono font-bold text-foreground tracking-tight">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
