import { useState, useEffect } from 'react';
import { useBrand } from '@/App';
import { fetchInterventions, Intervention } from '@/api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  MessageSquare,
  ShoppingCart,
  Loader2,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Rank color mapping ──────────────────────────────────────── */

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        bar: 'bg-blue-500',
        circle: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        label: 'text-blue-400',
      };
    case 2:
      return {
        bar: 'bg-emerald-500',
        circle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        label: 'text-emerald-400',
      };
    case 3:
      return {
        bar: 'bg-violet-500',
        circle: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        label: 'text-violet-400',
      };
    default:
      return {
        bar: 'bg-amber-500',
        circle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        label: 'text-amber-400',
      };
  }
}

export default function InterventionsPage() {
  const { selectedBrandId } = useBrand();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchInterventions(selectedBrandId)
      .then(setInterventions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  const totalTriggered = interventions.reduce((s, i) => s + i.triggered_count, 0);
  const totalChat = interventions.reduce((s, i) => s + i.chat_after, 0);
  const totalOrder = interventions.reduce((s, i) => s + i.order_after, 0);
  const avgLift =
    interventions.length > 0
      ? interventions.reduce((s, i) => s + i.conversion_lift, 0) / interventions.length
      : 0;
  const maxTriggered = Math.max(...interventions.map((i) => i.triggered_count), 1);

  /* Sort interventions by triggered_count descending for ranking */
  const ranked = [...interventions].sort((a, b) => b.triggered_count - a.triggered_count);
  const bestPerformer = ranked.length > 0 ? ranked[0].trigger_type : '--';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Interventions & Nudges
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance of proactive nudges and their impact on conversion
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!loading && interventions.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No intervention data available</p>
          </CardContent>
        </Card>
      )}

      {!loading && interventions.length > 0 && (
        <>
          {/* ── 4 KPI Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Avg Conversion Lift
                    </p>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                      {avgLift > 0 ? `+${avgLift.toFixed(1)}%` : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10">
                    <Bell className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Total Triggered
                    </p>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                      {totalTriggered.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Orders from Nudges
                    </p>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                      {totalOrder.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Best Performer
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5 truncate max-w-[160px]">
                      {bestPerformer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Ranked Nudge Cards ───────────────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Nudge Performance Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranked.map((inv, idx) => {
                const rank = idx + 1;
                const style = getRankStyle(rank);
                const barWidth = (inv.triggered_count / maxTriggered) * 100;
                const chatRate =
                  inv.triggered_count > 0
                    ? ((inv.chat_after / inv.triggered_count) * 100).toFixed(1)
                    : '0';

                return (
                  <div
                    key={inv.trigger_type}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-border/60 transition-colors"
                  >
                    {/* Rank circle */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border text-sm font-bold',
                        style.circle
                      )}
                    >
                      #{rank}
                    </div>

                    {/* Middle: name + progress bar */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {inv.trigger_type}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', style.bar)}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className={cn('text-[11px] font-medium tabular-nums flex-shrink-0', style.label)}>
                          {inv.conversion_lift > 0 ? `+${inv.conversion_lift.toFixed(1)}%` : '--'} lift
                        </span>
                      </div>
                    </div>

                    {/* Right: stats */}
                    <div className="flex items-center gap-5 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {inv.triggered_count.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Triggered
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {inv.order_after.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Orders
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {chatRate}%
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Chat Rate
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
