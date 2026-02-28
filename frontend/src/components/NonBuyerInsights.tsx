import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Objection, NonBuyer } from '../api/client';

interface Props {
  objections: Objection[];
  nonBuyers: NonBuyer[];
  loading: boolean;
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function NonBuyerInsights({ objections, nonBuyers, loading }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Objection Waterfall */}
      {objections.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Objection Waterfall
          </h3>
          <ResponsiveContainer width="100%" height={objections.length * 50 + 20}>
            <BarChart
              data={objections}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 10 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="type"
                width={180}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Count']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>

          {/* Expandable quotes */}
          <div className="mt-4 space-y-2">
            {objections.map((obj, idx) => (
              <div key={obj.type} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">{obj.type}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {obj.count} mentions
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {obj.resolved_pct.toFixed(0)}% resolved
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {expandedIdx === idx ? '▲' : '▼'}
                  </span>
                </button>
                {expandedIdx === idx && obj.verbatim_quotes && obj.verbatim_quotes.length > 0 && (
                  <div className="px-4 pb-3 space-y-2">
                    {obj.verbatim_quotes.map((q, qi) => (
                      <div
                        key={qi}
                        className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border-l-3 border-red-300 italic"
                      >
                        "{q}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Blocker Distribution */}
      {nonBuyers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Purchase Blocker Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nonBuyers}
                  dataKey="count"
                  nameKey="purchase_blocker"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ purchase_blocker, pct }: { purchase_blocker: string; pct: number }) =>
                    `${purchase_blocker} (${pct.toFixed(0)}%)`
                  }
                  labelLine
                >
                  {nonBuyers.map((_entry, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sample Quotes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Sample Customer Quotes
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-72">
              {nonBuyers.map((nb) =>
                nb.sample_quotes?.map((q, qi) => (
                  <div
                    key={`${nb.purchase_blocker}-${qi}`}
                    className="bg-gray-50 rounded-lg px-4 py-3 border-l-4 border-amber-400"
                  >
                    <p className="text-sm text-gray-700 italic">"{q}"</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Blocker: {nb.purchase_blocker}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
