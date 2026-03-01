import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Objection, NonBuyer } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Quote } from 'lucide-react';

interface Props {
  objections: Objection[];
  nonBuyers: NonBuyer[];
  loading: boolean;
}

const PIE_COLORS = [
  'hsl(240, 60%, 55%)',
  'hsl(35, 92%, 55%)',
  'hsl(0, 75%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(270, 55%, 55%)',
  'hsl(330, 65%, 55%)',
  'hsl(175, 55%, 45%)',
  'hsl(20, 80%, 55%)',
];

export default function NonBuyerInsights({ objections, nonBuyers, loading }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Objection Waterfall */}
      {objections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Objection Waterfall
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={objections.length * 48 + 20}>
              <BarChart
                data={objections}
                layout="vertical"
                margin={{ top: 0, right: 50, bottom: 0, left: 10 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="type"
                  width={170}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '13px',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>

            {/* Expandable objection quotes */}
            <div className="space-y-1">
              {objections.map((obj, idx) => (
                <div
                  key={obj.type}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="w-full h-auto justify-between px-4 py-2.5 rounded-none font-normal"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{obj.type}</span>
                      <Badge variant="destructive" className="text-[10px]">
                        {obj.count}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
                        {obj.resolved_pct.toFixed(0)}% resolved
                      </Badge>
                    </div>
                    {expandedIdx === idx ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  {expandedIdx === idx && obj.verbatim_quotes && obj.verbatim_quotes.length > 0 && (
                    <div className="px-4 pb-3 space-y-2">
                      {obj.verbatim_quotes.map((q, qi) => (
                        <div
                          key={qi}
                          className="flex items-start gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2 border-l-2 border-destructive"
                        >
                          <Quote className="h-3 w-3 flex-shrink-0 mt-1 opacity-50" />
                          <span className="italic">{q}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Blocker Distribution */}
      {nonBuyers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Purchase Blocker Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={nonBuyers}
                    dataKey="count"
                    nameKey="purchase_blocker"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({
                      purchase_blocker,
                      pct,
                    }: {
                      purchase_blocker: string;
                      pct: number;
                    }) => `${purchase_blocker} (${pct.toFixed(0)}%)`}
                    labelLine
                  >
                    {nonBuyers.map((_entry, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Count']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '13px',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Sample Customer Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="space-y-3 pr-4">
                  {nonBuyers.map((nb) =>
                    nb.sample_quotes?.map((q, qi) => (
                      <div
                        key={`${nb.purchase_blocker}-${qi}`}
                        className="bg-muted rounded-lg px-4 py-3 border-l-4 border-amber-400 dark:border-amber-500"
                      >
                        <p className="text-sm text-foreground italic leading-relaxed">
                          &ldquo;{q}&rdquo;
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className="text-[10px]">
                            {nb.purchase_blocker}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
