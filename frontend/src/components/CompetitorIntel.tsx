import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Objection } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Quote, AlertTriangle } from 'lucide-react';

interface Props {
  objections: Objection[];
  loading: boolean;
}

const COLORS = [
  'hsl(240, 60%, 55%)',
  'hsl(35, 92%, 55%)',
  'hsl(0, 75%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(270, 55%, 55%)',
  'hsl(330, 65%, 55%)',
  'hsl(175, 55%, 45%)',
  'hsl(20, 80%, 55%)',
];

export default function CompetitorIntel({ objections, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-5 bg-muted rounded w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const competitorData = objections.filter(
    (o) =>
      o.type.toLowerCase().includes('competitor') ||
      o.type.toLowerCase().includes('alternative') ||
      o.type.toLowerCase().includes('brand') ||
      o.type.toLowerCase().includes('comparison')
  );

  const displayData = competitorData.length > 0 ? competitorData : objections;

  if (displayData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="p-3 rounded-full bg-muted">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No competitor data available</p>
          <Badge variant="secondary" className="text-xs">
            Run LLM enrichment to populate this page
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie chart */}
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
                data={displayData}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={55}
                paddingAngle={2}
              >
                {displayData.map((_entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Mentions']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  fontSize: '13px',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-competitor cards */}
      <ScrollArea className="h-[440px]">
        <div className="space-y-4 pr-4">
          {displayData.map((item, idx) => (
            <Card key={item.type} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <h4 className="font-semibold text-foreground text-sm">{item.type}</h4>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Mentions</p>
                    <p className="font-bold tabular-nums">{item.count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Resolved</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {item.resolved_pct.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Top Severity</p>
                    <p className="font-bold tabular-nums">
                      {item.severity_breakdown
                        ? Object.entries(item.severity_breakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([k]) => k)[0] || '--'
                        : '--'}
                    </p>
                  </div>
                </div>

                {item.verbatim_quotes && item.verbatim_quotes.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                    <Quote className="h-3 w-3 flex-shrink-0 mt-0.5 opacity-50" />
                    <span className="italic line-clamp-2">{item.verbatim_quotes[0]}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
