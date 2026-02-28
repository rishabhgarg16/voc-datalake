import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Intervention } from '../api/client';

interface Props {
  interventions: Intervention[];
  loading: boolean;
}

export default function InterventionStats({ interventions, loading }: Props) {
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

  if (interventions.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No intervention data available</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nudge pipeline visualization */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Nudge Pipeline: Triggered → Chat → Order
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={interventions} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="trigger_type"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              dataKey="triggered_count"
              name="Triggered"
              fill="#c7d2fe"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="chat_after"
              name="Led to Chat"
              fill="#818cf8"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="order_after"
              name="Led to Order"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Per-Trigger Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Trigger Type</th>
                <th className="px-6 py-3 text-right">Triggered</th>
                <th className="px-6 py-3 text-right">Chat After</th>
                <th className="px-6 py-3 text-right">Order After</th>
                <th className="px-6 py-3 text-right">Conv Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interventions.map((inv) => (
                <tr key={inv.trigger_type} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {inv.trigger_type}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {inv.triggered_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {inv.chat_after.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {inv.order_after.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`font-semibold ${
                        inv.conversion_lift > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {inv.conversion_lift > 0 ? '+' : ''}
                      {inv.conversion_lift.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
