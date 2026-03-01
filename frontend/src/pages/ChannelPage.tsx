import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useBrand } from '@/App';
import { fetchChannelVoC, ChannelVoC } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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

/* ── Channel Page ─────────────────────────────────────────────── */

export default function ChannelPage() {
  const { selectedBrandId } = useBrand();
  const [data, setData] = useState<ChannelVoC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchChannelVoC(selectedBrandId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  /* derived insights */
  const topByTraffic = [...data].sort((a, b) => b.session_count - a.session_count)[0];
  const topByRevenue = [...data].sort((a, b) => b.total_revenue - a.total_revenue)[0];
  const totalRevenue = data.reduce((s, c) => s + c.total_revenue, 0);
  const totalSessions = data.reduce((s, c) => s + c.session_count, 0);

  /* chart data sorted by orders desc */
  const chartData = [...data]
    .sort((a, b) => b.order_count - a.order_count)
    .map((c) => ({
      source: c.utm_source || '(direct)',
      orders: c.order_count,
    }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Channel-Aware VoC</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance and voice-of-customer insights per traffic source
        </p>
      </div>

      {/* ── Insight callout cards ───────────────────────────────── */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topByTraffic && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Top Traffic Source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-foreground">
                  {topByTraffic.utm_source || '(direct)'}
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {totalSessions > 0
                    ? `${((topByTraffic.session_count / totalSessions) * 100).toFixed(0)}% of traffic`
                    : ''}
                </Badge>
              </CardContent>
            </Card>
          )}
          {topByRevenue && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Top Revenue Source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-foreground">
                  {topByRevenue.utm_source || '(direct)'}
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {totalRevenue > 0
                    ? `${((topByRevenue.total_revenue / totalRevenue) * 100).toFixed(0)}% of revenue`
                    : ''}
                </Badge>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Total Revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground">
                ₹{totalRevenue.toLocaleString()}
              </p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                Across {data.length} channels
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* ── Channel Table ──────────────────────────────────────── */}
      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground text-sm">No channel data available</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Source</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Chats</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right pr-6">Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((ch, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-6 font-medium text-foreground">
                      {ch.utm_source || '(direct)'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {ch.session_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {ch.chat_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {ch.order_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          ch.conversion_rate * 100 >= 5
                            ? 'default'
                            : ch.conversion_rate * 100 >= 2
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs tabular-nums"
                      >
                        {(ch.conversion_rate * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ₹{ch.total_revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6 tabular-nums">
                      {ch.avg_engagement.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Orders by Channel BarChart ─────────────────────────── */}
      {!loading && chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Orders by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 48, 200)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 30, bottom: 0, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="source"
                  width={100}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Orders']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '13px',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
