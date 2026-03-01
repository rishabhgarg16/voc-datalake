import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Intervention } from '@/api/client';
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
  interventions: Intervention[];
  loading: boolean;
}

export default function InterventionStats({ interventions, loading }: Props) {
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

  if (interventions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">No intervention data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Nudge Pipeline
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 border-0">
                Triggered
              </Badge>
              <span>→</span>
              <Badge variant="secondary" className="text-[10px] bg-indigo-200 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200 border-0">
                Chat
              </Badge>
              <span>→</span>
              <Badge variant="secondary" className="text-[10px] bg-indigo-500 text-white dark:bg-indigo-600 border-0">
                Order
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={interventions} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="trigger_type"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  fontSize: '13px',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey="triggered_count"
                name="Triggered"
                fill="hsl(240, 50%, 82%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="chat_after"
                name="Led to Chat"
                fill="hsl(240, 55%, 65%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="order_after"
                name="Led to Order"
                fill="hsl(240, 60%, 50%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Per-Trigger Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Trigger Type</TableHead>
                <TableHead className="text-right">Triggered</TableHead>
                <TableHead className="text-right">Chat After</TableHead>
                <TableHead className="text-right">Order After</TableHead>
                <TableHead className="text-right pr-6">Conv Lift</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interventions.map((inv) => (
                <TableRow key={inv.trigger_type}>
                  <TableCell className="pl-6 font-medium">
                    {inv.trigger_type}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inv.triggered_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inv.chat_after.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inv.order_after.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge
                      variant={inv.conversion_lift > 0 ? 'default' : 'destructive'}
                      className="text-xs tabular-nums"
                    >
                      {inv.conversion_lift > 0 ? '+' : ''}
                      {inv.conversion_lift.toFixed(1)}%
                    </Badge>
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
