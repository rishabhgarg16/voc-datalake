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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Minus } from 'lucide-react';

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

/* ── Sentiment badge styling ────────────────────────────────── */

function getSentimentStyle(sentiment: string) {
  const s = sentiment.trim().toLowerCase();
  if (s === 'negative') return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (s === 'positive') return 'bg-green-500/15 text-green-400 border-green-500/30';
  return 'bg-slate-500/15 text-slate-400 border-slate-500/30'; // neutral / other
}

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
        <Card className="animate-pulse border-border/50">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      ) : competitors.length === 0 ? (
        <Card className="border-border/50">
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
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
                  Total Mentions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {totalMentions.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
                  Competitors Found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {competitors.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-[11px] font-medium uppercase tracking-wider">
                  Top Competitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">
                  {competitors[0]?.competitor_name || '--'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="border-border/30" />

          {/* Pie Chart */}
          <Card className="border-border/50">
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

          {/* ── Intelligence Table ───────────────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Intelligence Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Competitor
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mentions
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sentiment
                    </TableHead>
                    <TableHead className="text-center pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Trend
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((comp, idx) => {
                    const sentiments = comp.sentiments
                      ? comp.sentiments.split(',').map((s) => s.trim()).filter(Boolean)
                      : [];
                    // Deduplicate sentiments
                    const uniqueSentiments = [...new Set(sentiments)];

                    return (
                      <TableRow key={idx} className="border-border/30">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-sm font-medium text-foreground">
                              {comp.competitor_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {comp.mention_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {uniqueSentiments.length > 0 ? (
                              uniqueSentiments.map((s) => (
                                <Badge
                                  key={s}
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] border capitalize',
                                    getSentimentStyle(s)
                                  )}
                                >
                                  {s}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">--</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Minus className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
