import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useBrand } from '@/App';
import { fetchCompetitors, Competitor } from '@/api/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

export default function CompetitorsPage() {
  const { selectedBrandId } = useBrand();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchCompetitors(selectedBrandId)
      .then(setCompetitors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  const totalMentions = competitors.reduce((s, c) => s + c.mention_count, 0);

  const pieData = competitors.map((c) => ({
    name: c.competitor_name,
    value: c.mention_count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Competitor Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Which competitors customers mention in conversations and why
        </p>
      </div>

      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      ) : competitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              No Competitor Data Yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Competitor intelligence is extracted from chat conversations via LLM enrichment.
            </p>
            <Badge variant="secondary">Run LLM enrichment to populate</Badge>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary KPIs */}
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
                  Competitors Found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {competitors.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Top Competitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {competitors[0]?.competitor_name || '--'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Pie Chart */}
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
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
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

          {/* Detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((comp, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {comp.competitor_name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      {comp.mention_count} mentions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Sentiment */}
                  <div className="flex flex-wrap gap-1.5">
                    {comp.sentiments?.split(', ').map((s) => (
                      <Badge
                        key={s}
                        variant={s === 'negative' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>

                  {/* Context */}
                  {comp.contexts && (
                    <>
                      <Separator />
                      <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">
                        {comp.contexts.split(' | ')[0]}
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
