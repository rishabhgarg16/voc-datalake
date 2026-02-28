import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useBrand } from '../App';
import {
  fetchOverview,
  fetchFunnel,
  fetchTrends,
  Overview,
  FunnelStage,
  TrendPoint,
} from '../api/client';
import KPICards from '../components/KPICards';
import ConversionFunnel from '../components/ConversionFunnel';

export default function Dashboard() {
  const { selectedBrandId } = useBrand();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    Promise.all([
      fetchOverview(selectedBrandId),
      fetchFunnel(selectedBrandId),
      fetchTrends(selectedBrandId),
    ])
      .then(([ov, fn, tr]) => {
        setOverview(ov);
        setStages(fn.stages || []);
        setTrends(tr || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  const formattedTrends = trends.map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Overview</h2>
        <p className="text-sm text-gray-400">Key performance indicators at a glance</p>
      </div>

      <KPICards data={overview} loading={loading} />

      {/* Daily Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Daily Trends
        </h3>
        {loading ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        ) : formattedTrends.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
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
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Sessions"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Orders"
              />
              <Line
                type="monotone"
                dataKey="chats"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Chats"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ConversionFunnel stages={stages} loading={loading} />

      {/* Top Objection / Competitor callouts */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Top Objection
            </p>
            <p className="text-lg font-semibold text-red-600">
              {overview.top_objection || '--'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Top Competitor Mentioned
            </p>
            <p className="text-lg font-semibold text-amber-600">
              {overview.top_competitor || '--'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
