import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { FunnelStage } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  stages: FunnelStage[];
  loading: boolean;
}

const COLORS = ['hsl(240, 60%, 55%)', 'hsl(240, 55%, 65%)', 'hsl(240, 50%, 72%)', 'hsl(240, 45%, 78%)', 'hsl(240, 40%, 84%)'];

export default function ConversionFunnel({ stages, loading }: Props) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">No funnel data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={30}>
              {stages.map((_entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                formatter={(v: number) => v.toLocaleString()}
                style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
