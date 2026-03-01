import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSessions, SessionListItem } from '@/api/client';
import { useBrand } from '@/App';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function SessionExplorer() {
  const { selectedBrandId } = useBrand();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterChat, setFilterChat] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchSessions(selectedBrandId, page, filterChat)
      .then((data) => {
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId, page, filterChat]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filter:</span>
          {[
            { label: 'All', value: undefined },
            { label: 'With Chat', value: true },
            { label: 'No Chat', value: false },
          ].map((opt) => (
            <Button
              key={opt.label}
              variant={filterChat === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterChat(opt.value as boolean | undefined);
                setPage(1);
              }}
              className="h-7 text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Badge variant="secondary" className="text-xs">
          {total.toLocaleString()} sessions
        </Badge>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : sessions.length === 0 ? (
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground text-sm">No sessions found</p>
          </CardContent>
        ) : (
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Session ID</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-center">Chat</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="pr-6">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow
                    key={s.session_id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                  >
                    <TableCell className="pl-6 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {s.session_id.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.synced_at
                        ? new Date(s.synced_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '--'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(s as Record<string, unknown>).page_count?.toString() ?? '--'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-block w-2 h-2 rounded-full',
                          s.has_talked_to_bot ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-block w-2 h-2 rounded-full',
                          s.has_placed_order ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          s.engagement_score >= 7
                            ? 'default'
                            : s.engagement_score >= 4
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs tabular-nums"
                      >
                        {s.engagement_score?.toFixed(1) ?? '--'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-xs text-muted-foreground">
                      {(s as Record<string, unknown>).utm_source?.toString() || '(direct)'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={sessions.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
