import { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useBrand } from '@/App';
import { fetchObjections, Objection } from '@/api/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/* ── Pie colors ───────────────────────────────────────────────── */

const PIE_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

/* ── Competitors Page ─────────────────────────────────────────── */

export default function CompetitorsPage() {
  const { selectedBrandId } = useBrand();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchObjections(selectedBrandId)
      .then(setObjections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  /*
   * Competitor data comes from enrichment. We treat each objection "type"
   * as a competitor mention category for the purpose of this view.
   * If the objections list is empty, enrichment has not been run.
   */
  const competitorData = useMemo(() => {
    if (objections.length === 0) return [];
    return objections.map((obj) => ({
      name: obj.type,
      count: obj.count,
      resolved_pct: obj.resolved_pct,
      quotes: obj.verbatim_quotes,
      severity: obj.severity_breakdown,
    }));
  }, [objections]);

  const totalMentions = competitorData.reduce((s, c) => s + c.count, 0);

  const pieData = competitorData.map((c) => ({
    name: c.name,
    value: c.count,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Competitor Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          How competitors are being mentioned and compared in customer conversations
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      ) : competitorData.length === 0 ? (
        /* ── Empty state ──────────────────────────────────────── */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              No Competitor Data Yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Competitor intelligence is derived from LLM-enriched session data.
              Once enrichment is run, competitor mentions will appear here.
            </p>
            <Badge variant="secondary">
              Run LLM enrichment to see competitor intelligence
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Summary KPI ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Total Mentions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {totalMentions.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {competitorData.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Avg Resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {competitorData.length > 0
                    ? (
                        competitorData.reduce((s, c) => s + c.resolved_pct, 0) /
                        competitorData.length
                      ).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* ── PieChart for mention share ──────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Competitor Mention Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {pieData.map((_entry, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Mentions']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '13px',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── Detail cards per competitor ─────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitorData.map((comp, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {comp.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      {comp.count.toLocaleString()} mentions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Severity badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(comp.severity).map(([level, count]) => (
                      <Badge key={level} variant="outline" className="text-[10px]">
                        {level}: {count}
                      </Badge>
                    ))}
                  </div>

                  {/* Resolved */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolved</span>
                    <Badge
                      variant={comp.resolved_pct >= 50 ? 'default' : 'destructive'}
                      className="text-xs tabular-nums"
                    >
                      {comp.resolved_pct.toFixed(1)}%
                    </Badge>
                  </div>

                  {/* Sample quote */}
                  {comp.quotes.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "{comp.quotes[0]}"
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
