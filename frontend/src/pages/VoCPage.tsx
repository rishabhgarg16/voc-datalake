import { useState, useEffect } from 'react';
import { useBrand } from '@/App';
import {
  fetchObjections,
  fetchInfoGaps,
  fetchIntents,
  Objection,
  InfoGap,
  Intent,
} from '@/api/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

/* ── VoC Page (Non-Buyer Intelligence) ────────────────────────── */

export default function VoCPage() {
  const { selectedBrandId } = useBrand();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [infoGaps, setInfoGaps] = useState<InfoGap[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    Promise.all([
      fetchObjections(selectedBrandId),
      fetchInfoGaps(selectedBrandId),
      fetchIntents(selectedBrandId),
    ])
      .then(([obj, ig, int]) => {
        setObjections(obj);
        setInfoGaps(ig);
        setIntents(int);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  /* ── Loading skeleton ──────────────────────────────────────── */
  const TableSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/6" />
        </div>
      </CardContent>
    </Card>
  );

  /* ── Empty state ───────────────────────────────────────────── */
  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Badge variant="secondary" className="text-xs">
          Run LLM enrichment to populate
        </Badge>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Non-Buyer Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Understand why visitors are not converting and what blocks purchases
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="objections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="objections" className="gap-1.5">
            Objections
            {objections.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {objections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="infogaps" className="gap-1.5">
            Info Gaps
            {infoGaps.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {infoGaps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="intents" className="gap-1.5">
            Intents
            {intents.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {intents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Objections tab ────────────────────────────────────── */}
        <TabsContent value="objections">
          {loading ? (
            <TableSkeleton />
          ) : objections.length === 0 ? (
            <EmptyState message="No objection data available" />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  Customer Objections
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Objection Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Resolved %</TableHead>
                      <TableHead className="pl-4">Severity Breakdown</TableHead>
                      <TableHead className="pr-6">Sample Quotes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objections.map((obj, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-6 font-medium text-foreground">
                          {obj.type}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {obj.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={obj.resolved_pct >= 50 ? 'default' : 'outline'}
                            className="text-xs tabular-nums"
                          >
                            {obj.resolved_pct.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="pl-4">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(obj.severity_breakdown).map(([level, count]) => (
                              <Badge
                                key={level}
                                variant="secondary"
                                className={cn(
                                  'text-[10px]',
                                  level.toLowerCase() === 'high' &&
                                    'bg-destructive/10 text-destructive border-destructive/20',
                                  level.toLowerCase() === 'medium' &&
                                    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                                )}
                              >
                                {level}: {count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 max-w-xs">
                          {obj.verbatim_quotes.length > 0 ? (
                            <p className="text-xs text-muted-foreground truncate italic">
                              "{obj.verbatim_quotes[0]}"
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Info Gaps tab ─────────────────────────────────────── */}
        <TabsContent value="infogaps">
          {loading ? (
            <TableSkeleton />
          ) : infoGaps.length === 0 ? (
            <EmptyState message="No info gap data available" />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  Information Gaps
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Question</TableHead>
                      <TableHead className="text-right">Frequency</TableHead>
                      <TableHead>Agent Quality</TableHead>
                      <TableHead>Shopper Reaction</TableHead>
                      <TableHead className="pr-6">Product</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {infoGaps.map((gap, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-6 font-medium text-foreground max-w-sm">
                          {gap.question}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {gap.frequency.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              gap.agent_quality.toLowerCase() === 'good'
                                ? 'default'
                                : gap.agent_quality.toLowerCase() === 'partial'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {gap.agent_quality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {gap.shopper_reaction}
                        </TableCell>
                        <TableCell className="pr-6 text-muted-foreground text-sm">
                          {gap.product || '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Intents tab ──────────────────────────────────────── */}
        <TabsContent value="intents">
          {loading ? (
            <TableSkeleton />
          ) : intents.length === 0 ? (
            <EmptyState message="No intent data available" />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  Intent Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Intent</TableHead>
                      <TableHead>Sub-Intent</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right pr-6">Conv Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intents.map((intent, idx) => {
                      const convRate =
                        intent.count > 0
                          ? ((intent.conversion_count / intent.count) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <TableRow key={idx}>
                          <TableCell className="pl-6 font-medium text-foreground">
                            {intent.primary_intent}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {intent.secondary_intent || '--'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {intent.count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {intent.conversion_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge
                              variant={
                                parseFloat(convRate) >= 5
                                  ? 'default'
                                  : parseFloat(convRate) >= 2
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs tabular-nums"
                            >
                              {convRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
