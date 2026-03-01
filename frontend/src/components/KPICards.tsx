import { Overview } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Eye,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
  MessagesSquare,
  DollarSign,
  Activity,
  UserCheck,
  Info,
} from 'lucide-react';

interface Props {
  data: Overview | null;
  loading: boolean;
}

interface KPI {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

function fmt(n: number | undefined, decimals = 0): string {
  if (n === undefined || n === null) return '--';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function KPICards({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const kpis: KPI[] = [
    {
      label: 'Sessions',
      value: fmt(data.total_sessions),
      description: 'Total unique visitor sessions',
      icon: Eye,
      color: 'text-indigo-500',
    },
    {
      label: 'Chats',
      value: fmt(data.total_chats),
      description: 'Sessions with bot interactions',
      icon: MessageSquare,
      color: 'text-blue-500',
    },
    {
      label: 'Orders',
      value: fmt(data.total_orders),
      description: 'Total orders placed',
      icon: ShoppingCart,
      color: 'text-emerald-500',
    },
    {
      label: 'Conv Rate',
      value: `${fmt(data.conversion_rate, 1)}%`,
      description: 'Session-to-order conversion rate',
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Chat Conv Rate',
      value: `${fmt(data.chat_conversion_rate, 1)}%`,
      description: 'Chat-to-order conversion rate',
      icon: MessagesSquare,
      color: 'text-teal-500',
    },
    {
      label: 'AOV',
      value: `₹${fmt(data.avg_order_value, 0)}`,
      description: 'Average order value',
      icon: DollarSign,
      color: 'text-amber-500',
    },
    {
      label: 'Avg Engagement',
      value: fmt(data.avg_engagement_score, 1),
      description: 'Average engagement score (0-10)',
      icon: Activity,
      color: 'text-purple-500',
    },
    {
      label: 'Returning %',
      value: `${fmt(data.returning_visitor_pct, 1)}%`,
      description: 'Returning visitor percentage',
      icon: UserCheck,
      color: 'text-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            className="group hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    {kpi.description}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {kpi.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                {kpi.label}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
