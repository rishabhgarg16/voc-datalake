import { useState, useEffect } from 'react';
import { useBrand } from '@/App';
import { fetchInterventions, Intervention } from '@/api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Bell,
  MessageSquare,
  ShoppingCart,
  ArrowRight,
  Loader2,
  TrendingUp,
} from 'lucide-react';

export default function InterventionsPage() {
  const { selectedBrandId } = useBrand();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchInterventions(selectedBrandId)
      .then(setInterventions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  const totalTriggered = interventions.reduce((s, i) => s + i.triggered_count, 0);
  const totalChat = interventions.reduce((s, i) => s + i.chat_after, 0);
  const totalOrder = interventions.reduce((s, i) => s + i.order_after, 0);
  const avgLift =
    interventions.length > 0
      ? interventions.reduce((s, i) => s + i.conversion_lift, 0) / interventions.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Interventions & Nudges
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance of proactive nudges and their impact on conversion
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!loading && interventions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No intervention data available</p>
          </CardContent>
        </Card>
      )}

      {!loading && interventions.length > 0 && (
        <>
          {/* Summary KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Bell className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Total Triggered
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {totalTriggered.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Led to Chat
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {totalChat.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Led to Order
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {totalOrder.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Avg Conv Lift
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {avgLift > 0 ? `+${avgLift.toFixed(1)}%` : '--'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline visualization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Nudge Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interventions.map((inv, idx) => {
                  const chatPct =
                    inv.triggered_count > 0
                      ? ((inv.chat_after / inv.triggered_count) * 100).toFixed(1)
                      : '0';
                  const orderPct =
                    inv.triggered_count > 0
                      ? ((inv.order_after / inv.triggered_count) * 100).toFixed(1)
                      : '0';

                  return (
                    <div key={inv.trigger_type}>
                      <p className="text-sm font-medium text-foreground mb-2">
                        {inv.trigger_type}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Triggered */}
                        <Card className="flex-1 min-w-[140px] border-l-4 border-l-indigo-500">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                              <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Triggered
                              </p>
                              <p className="text-lg font-bold tabular-nums text-foreground">
                                {inv.triggered_count.toLocaleString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />

                        {/* Led to Chat */}
                        <Card className="flex-1 min-w-[140px] border-l-4 border-l-blue-500">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Led to Chat
                              </p>
                              <p className="text-lg font-bold tabular-nums text-foreground">
                                {inv.chat_after.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  ({chatPct}%)
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />

                        {/* Led to Order */}
                        <Card className="flex-1 min-w-[140px] border-l-4 border-l-emerald-500">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                              <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Led to Order
                              </p>
                              <p className="text-lg font-bold tabular-nums text-foreground">
                                {inv.order_after.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  ({orderPct}%)
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      {idx < interventions.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats table */}
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
                    <TableHead className="text-right">Chat Rate</TableHead>
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
                      <TableCell className="text-right tabular-nums">
                        {inv.triggered_count > 0
                          ? `${((inv.chat_after / inv.triggered_count) * 100).toFixed(1)}%`
                          : '--'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge
                          variant={inv.conversion_lift > 0 ? 'default' : 'secondary'}
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
        </>
      )}
    </div>
  );
}
