import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import { useBrand } from '@/App';
import {
  fetchOverview,
  fetchFunnel,
  fetchTrends,
  Overview,
  FunnelStage,
  TrendPoint,
} from '@/api/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ── KPI configuration ────────────────────────────────────────── */

interface KPIDef {
  label: string;
  key: keyof Overview;
  format: (v: number) => string;
  accent: string;
}

const KPIS: KPIDef[] = [
  {
    label: 'Sessions',
    key: 'total_sessions',
    format: (v) => v.toLocaleString(),
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'Chats',
    key: 'total_chats',
    format: (v) => v.toLocaleString(),
    accent: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Orders',
    key: 'total_orders',
    format: (v) => v.toLocaleString(),
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Conv Rate',
    key: 'conversion_rate',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Chat Conv Rate',
    key: 'chat_conversion_rate',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    accent: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'AOV',
    key: 'avg_order_value',
    format: (v) => `₹${v.toLocaleString()}`,
    accent: 'text-rose-600 dark:text-rose-400',
  },
  {
    label: 'Avg Engagement',
    key: 'avg_engagement_score',
    format: (v) => v.toFixed(1),
    accent: 'text-teal-600 dark:text-teal-400',
  },
  {
    label: 'Returning %',
    key: 'returning_visitor_pct',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    accent: 'text-orange-600 dark:text-orange-400',
  },
];

const FUNNEL_COLORS = [
  'hsl(240, 60%, 55%)',
  'hsl(240, 55%, 65%)',
  'hsl(240, 50%, 72%)',
  'hsl(240, 45%, 78%)',
  'hsl(240, 40%, 84%)',
];

/* ── Dashboard ────────────────────────────────────────────────── */

export default function Dashboard() {
  const { selectedBrandId } = useBrand();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    Promise.all([
      fetchOverview(selectedBrandId),
      fetchFunnel(selectedBrandId),
      fetchTrends(selectedBrandId),
    ])
      .then(([ov, fn, tr]) => {
        setOverview(ov);
        setStages(fn.stages || []);
        setTrends(tr || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  const formattedTrends = trends.map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Key performance indicators at a glance
        </p>
      </div>

      {/* ── 8 KPI Cards ─────────────────────────────────────────── */}
      {loading || !overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-3 bg-muted rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="h-7 bg-muted rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KPIS.map((kpi) => (
            <Card key={kpi.key}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  {kpi.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={cn('text-2xl font-bold', kpi.accent)}>
                  {kpi.format(overview[kpi.key] as number)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* ── Daily Trends LineChart ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Daily Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : formattedTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={formattedTrends}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '13px',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Sessions"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Orders"
                />
                <Line
                  type="monotone"
                  dataKey="chats"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Chats"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Conversion Funnel ──────────────────────────────────── */}
      {loading ? (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-5 bg-muted rounded w-40" />
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded" />
          </CardContent>
        </Card>
      ) : stages.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">No funnel data available</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Conversion Funnel
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stages.length} stages
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={stages.length * 56 + 20}>
              <BarChart
                data={stages}
                layout="vertical"
                margin={{ top: 0, right: 50, bottom: 0, left: 10 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '13px',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={30}>
                  {stages.map((_entry, idx) => (
                    <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    formatter={(v: number) => v.toLocaleString()}
                    style={{
                      fontSize: 11,
                      fill: 'hsl(var(--muted-foreground))',
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <Separator className="my-4" />
            <div className="flex flex-wrap gap-3">
              {stages.map((s, i) =>
                i > 0 && s.drop_off_pct > 0 ? (
                  <Badge key={s.name} variant="outline" className="text-xs">
                    {s.name}: -{s.drop_off_pct.toFixed(1)}% drop
                  </Badge>
                ) : null,
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Top Objection / Top Competitor ─────────────────────── */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Top Objection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-destructive">
                {overview.top_objection || '--'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Top Competitor Mentioned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                {overview.top_competitor || '--'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
