import { useState, useEffect, useMemo } from 'react';
import { useBrand } from '@/App';
import { fetchProducts, Product } from '@/api/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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

/* ── Helpers ──────────────────────────────────────────────────── */

/** "my-great-product" → "My Great Product" */
function formatHandle(handle: string): string {
  return handle
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Product Page ─────────────────────────────────────────────── */

export default function ProductPage() {
  const { selectedBrandId } = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchProducts(selectedBrandId)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  /* sort by view_count descending */
  const sorted = useMemo(
    () => [...products].sort((a, b) => b.view_count - a.view_count),
    [products],
  );

  const totalViews = products.reduce((s, p) => s + p.view_count, 0);
  const avgConv =
    products.length > 0
      ? products.reduce((s, p) => s + p.conversion_rate, 0) / products.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Product Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View counts, sessions, and conversion rates per product
        </p>
      </div>

      {/* ── Summary cards ──────────────────────────────────────── */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Total Products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Total Views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {totalViews.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                Avg Conv Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {avgConv.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* ── Product Table ──────────────────────────────────────── */}
      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground text-sm">No product data available</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Products by Views
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Unique Sessions</TableHead>
                  <TableHead className="text-right pr-6">Conv Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((product, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-6 font-medium text-foreground">
                      {formatHandle(product.product_handle)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product.view_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product.unique_sessions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge
                        variant={
                          product.conversion_rate >= 5
                            ? 'default'
                            : product.conversion_rate >= 2
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs tabular-nums"
                      >
                        {product.conversion_rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
