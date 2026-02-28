import { Overview } from '../api/client';

interface Props {
  data: Overview | null;
  loading: boolean;
}

interface KPI {
  label: string;
  value: string;
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
          <div
            key={i}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const kpis: KPI[] = [
    { label: 'Sessions', value: fmt(data.total_sessions), color: 'text-brand-600' },
    { label: 'Chats', value: fmt(data.total_chats), color: 'text-blue-600' },
    { label: 'Orders', value: fmt(data.total_orders), color: 'text-emerald-600' },
    { label: 'Conv Rate', value: `${fmt(data.conversion_rate, 1)}%`, color: 'text-green-600' },
    { label: 'Chat Conv Rate', value: `${fmt(data.chat_conversion_rate, 1)}%`, color: 'text-teal-600' },
    { label: 'AOV', value: `₹${fmt(data.avg_order_value, 0)}`, color: 'text-amber-600' },
    { label: 'Avg Engagement', value: fmt(data.avg_engagement_score, 1), color: 'text-purple-600' },
    { label: 'Returning %', value: `${fmt(data.returning_visitor_pct, 1)}%`, color: 'text-rose-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {kpi.label}
          </p>
          <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
