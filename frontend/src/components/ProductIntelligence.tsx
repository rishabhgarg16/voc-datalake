import { useState, useMemo } from 'react';
import { Product } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  products: Product[];
  loading: boolean;
}

type SortKey = 'product_handle' | 'view_count' | 'unique_sessions' | 'conversion_rate';
type SortDir = 'asc' | 'desc';

export default function ProductIntelligence({ products, loading }: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('view_count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [products, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">No product data available</p>
        </CardContent>
      </Card>
    );
  }

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className={cn(
        'h-auto p-0 font-medium text-xs hover:bg-transparent',
        sortKey === field ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Product Performance
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {products.length} products
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">
                <SortButton label="Product" field="product_handle" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Views" field="view_count" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Unique Sessions" field="unique_sessions" />
              </TableHead>
              <TableHead className="text-right pr-6">
                <SortButton label="Conv Rate" field="conversion_rate" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <>
                <TableRow
                  key={p.product_handle}
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === p.product_handle ? null : p.product_handle
                    )
                  }
                >
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      {expandedRow === p.product_handle ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {p.product_handle}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.view_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.unique_sessions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge
                      variant={p.conversion_rate >= 5 ? 'default' : p.conversion_rate >= 2 ? 'secondary' : 'destructive'}
                      className="text-xs tabular-nums"
                    >
                      {p.conversion_rate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
                {expandedRow === p.product_handle && (
                  <TableRow key={`${p.product_handle}-detail`}>
                    <TableCell colSpan={4} className="bg-muted/50 px-6 py-4">
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            View-to-Session Ratio
                          </p>
                          <p className="font-bold text-foreground tabular-nums">
                            {p.unique_sessions > 0
                              ? (p.view_count / p.unique_sessions).toFixed(1)
                              : '--'}
                            x
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Est. Orders
                          </p>
                          <p className="font-bold text-foreground tabular-nums">
                            {Math.round(
                              p.unique_sessions * (p.conversion_rate / 100)
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Performance
                          </p>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all',
                                p.conversion_rate >= 5
                                  ? 'bg-emerald-500'
                                  : p.conversion_rate >= 2
                                  ? 'bg-amber-500'
                                  : 'bg-destructive'
                              )}
                              style={{
                                width: `${Math.min(p.conversion_rate * 5, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
