import { useState, useEffect } from 'react';
import { useBrand } from '@/App';
import { fetchSegments, Segment } from '@/api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Users, TrendingUp, Activity, BarChart3 } from 'lucide-react';

const SEGMENT_COLORS: Record<string, { border: string; badge: string }> = {
  'High Intent Drop-off': {
    border: 'border-l-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  },
  'Chat Converters': {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  'Silent Converters': {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  },
  'Window Shoppers': {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  'Returning Engaged': {
    border: 'border-l-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  },
  'Nudge Responsive': {
    border: 'border-l-purple-500',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
};

const FALLBACK_COLORS = [
  { border: 'border-l-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { border: 'border-l-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
  { border: 'border-l-cyan-500', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
];

function getColor(name: string, idx: number) {
  return SEGMENT_COLORS[name] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

export default function PersonasPage() {
  const { selectedBrandId } = useBrand();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchSegments(selectedBrandId)
      .then(setSegments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  const totalShoppers = segments.reduce((s, seg) => s + seg.count, 0);
  const highestConv = segments.length > 0 ? Math.max(...segments.map((s) => s.conversion_rate)) : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Shopper Personas
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Behavioral segments derived from session data and chat interactions
        </p>
      </div>

      {/* Summary strip */}
      {!loading && segments.length > 0 && (
        <Card>
          <CardContent className="p-5 flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Total Segments
              </p>
              <p className="text-2xl font-bold text-foreground">{segments.length}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Total Shoppers
              </p>
              <p className="text-2xl font-bold text-foreground">
                {totalShoppers.toLocaleString()}
              </p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Highest Conv Rate
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {/* conversion_rate needs backend support */}
                --
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
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
      )}

      {/* Empty state */}
      {!loading && segments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No persona data available</p>
          </CardContent>
        </Card>
      )}

      {/* Persona cards grid */}
      {!loading && segments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg, idx) => {
            const color = getColor(seg.segment_name, idx);
            return (
              <Card
                key={seg.segment_name}
                className={cn(
                  'border-l-4 hover:shadow-md transition-shadow',
                  color.border
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{seg.segment_name}</CardTitle>
                    <Badge className={cn('text-[10px] border-0', color.badge)}>
                      {seg.pct.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Count
                    </span>
                    <span className="font-bold tabular-nums">
                      {seg.count.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Conv Rate
                    </span>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      {/* conversion_rate needs backend support */}
                      --
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      Engagement
                    </span>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      {/* avg_engagement needs backend support */}
                      --
                    </span>
                  </div>

                  {/* Percentage bar */}
                  <div className="pt-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-foreground/30 transition-all"
                        style={{ width: `${Math.min(seg.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
