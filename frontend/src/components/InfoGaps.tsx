import { InfoGap } from '@/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  gaps: InfoGap[];
  loading: boolean;
}

function qualityVariant(q: string): 'default' | 'secondary' | 'destructive' {
  const lower = q.toLowerCase();
  if (lower.includes('good') || lower.includes('high') || lower.includes('excellent'))
    return 'default';
  if (lower.includes('poor') || lower.includes('low') || lower.includes('bad'))
    return 'destructive';
  return 'secondary';
}

export default function InfoGaps({ gaps, loading }: Props) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gaps.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            No information gaps data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
          Information Gaps
        </CardTitle>
        <CardDescription>
          Questions customers frequently ask that may lack good answers
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 min-w-[200px]">Question</TableHead>
              <TableHead className="text-right">Frequency</TableHead>
              <TableHead className="text-center">Agent Quality</TableHead>
              <TableHead>Shopper Reaction</TableHead>
              <TableHead className="pr-6">Product</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gaps.map((g, idx) => (
              <TableRow key={idx}>
                <TableCell className="pl-6 font-medium max-w-sm">
                  {g.question}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {g.frequency.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={qualityVariant(g.agent_quality)} className="text-xs">
                    {g.agent_quality}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-xs">
                  {g.shopper_reaction}
                </TableCell>
                <TableCell className="pr-6">
                  <Badge variant="outline" className="text-xs">
                    {g.product}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
