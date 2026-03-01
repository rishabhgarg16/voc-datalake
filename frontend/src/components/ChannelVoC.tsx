import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChannelVoC as ChannelData } from '@/api/client';
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

interface Props {
  data: ChannelData[];
  loading: boolean;
}

export default function ChannelVoC({ data, loading }: Props) {
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

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">No channel data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue by Channel chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Revenue by Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="utm_source"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  fontSize: '13px',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Bar
                dataKey="total_revenue"
                name="Revenue"
                fill="hsl(var(--chart-1))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Channel Table */}
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
              {data.map((ch) => (
                <TableRow key={ch.utm_source}>
                  <TableCell className="pl-6 font-medium">
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
                  <TableCell className="text-right tabular-nums">
                    <Badge
                      variant={ch.conversion_rate >= 3 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ch.conversion_rate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
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
    </div>
  );
}
