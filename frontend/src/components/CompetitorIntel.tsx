import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Objection } from '../api/client';

interface Props {
  objections: Objection[];
  loading: boolean;
}

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function CompetitorIntel({ objections, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  // For competitor intel, we filter objections that might be competitor-related
  // or just display the full objections as "competitive intelligence"
  const competitorData = objections.filter((o) =>
    o.type.toLowerCase().includes('competitor') ||
    o.type.toLowerCase().includes('alternative') ||
    o.type.toLowerCase().includes('brand') ||
    o.type.toLowerCase().includes('comparison')
  );

  const displayData = competitorData.length > 0 ? competitorData : objections;

  if (displayData.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No competitor data available</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mention share donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Competitor Mention Share
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={displayData}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                paddingAngle={2}
              >
                {displayData.map((_entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Mentions']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Per-competitor cards */}
        <div className="space-y-4">
          {displayData.map((item, idx) => (
            <div
              key={item.type}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <h4 className="font-semibold text-gray-800">{item.type}</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Mentions</p>
                  <p className="font-bold text-gray-800">{item.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Resolved</p>
                  <p className="font-bold text-green-600">{item.resolved_pct.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Severity</p>
                  <p className="font-bold text-gray-800">
                    {item.severity_breakdown
                      ? Object.entries(item.severity_breakdown)
                          .sort((a, b) => b[1] - a[1])
                          .map(([k]) => k)[0] || '--'
                      : '--'}
                  </p>
                </div>
              </div>
              {item.verbatim_quotes && item.verbatim_quotes.length > 0 && (
                <div className="mt-3 text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">
                  "{item.verbatim_quotes[0]}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
