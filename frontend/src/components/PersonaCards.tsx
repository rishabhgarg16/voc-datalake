import { Segment } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Activity } from 'lucide-react';

interface Props {
  segments: Segment[];
  loading: boolean;
}

const PERSONA_ACCENT_COLORS = [
  { border: 'border-l-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { border: 'border-l-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
  { border: 'border-l-cyan-500', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
];

export default function PersonaCards({ segments, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-5 bg-muted rounded w-32 mb-4" />
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-4 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">No persona data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {segments.map((seg, idx) => {
        const accent = PERSONA_ACCENT_COLORS[idx % PERSONA_ACCENT_COLORS.length];
        return (
          <Card
            key={seg.segment_name}
            className={`border-l-4 ${accent.border} hover:shadow-md transition-shadow`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">
                  {seg.segment_name}
                </h3>
                <Badge className={`text-[10px] ${accent.badge} border-0`}>
                  {seg.pct.toFixed(1)}%
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Count
                  </span>
                  <span className="font-semibold tabular-nums">
                    {seg.count.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Conv Rate
                  </span>
                  <span className="font-semibold tabular-nums">
                    {seg.conversion_rate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" />
                    Engagement
                  </span>
                  <span className="font-semibold tabular-nums">
                    {seg.avg_engagement.toFixed(1)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-foreground/30 transition-all"
                      style={{ width: `${Math.min(seg.pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
