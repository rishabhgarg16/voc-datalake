import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChannelVoC as ChannelData } from '../api/client';

interface Props {
  data: ChannelData[];
  loading: boolean;
}

export default function ChannelVoC({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-400 text-center">
        No channel data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar chart: Orders by Channel */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Orders by Channel
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="utm_source"
              tick={{ fontSize: 12, fill: '#6b7280' }}
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
            <Bar dataKey="order_count" name="Orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Channel Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3 text-right">Sessions</th>
                <th className="px-6 py-3 text-right">Chats</th>
                <th className="px-6 py-3 text-right">Orders</th>
                <th className="px-6 py-3 text-right">Conv Rate</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3">Top Objections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((ch) => (
                <tr key={ch.utm_source} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{ch.utm_source || '(direct)'}</td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {ch.session_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {ch.chat_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {ch.order_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {ch.conversion_rate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    ₹{ch.total_revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {ch.top_objections?.join(', ') || '--'}
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
