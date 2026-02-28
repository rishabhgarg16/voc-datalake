import { useState, useEffect } from 'react';
import { useBrand } from '../App';
import { fetchChannelVoC, ChannelVoC as ChannelData } from '../api/client';
import ChannelVoC from '../components/ChannelVoC';

export default function ChannelPage() {
  const { selectedBrandId } = useBrand();
  const [data, setData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchChannelVoC(selectedBrandId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  // Derive some insight callouts
  const topByTraffic = [...data].sort((a, b) => b.session_count - a.session_count)[0];
  const topByRevenue = [...data].sort((a, b) => b.total_revenue - a.total_revenue)[0];
  const totalRevenue = data.reduce((s, c) => s + c.total_revenue, 0);
  const totalSessions = data.reduce((s, c) => s + c.session_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Channel-Aware VoC</h2>
        <p className="text-sm text-gray-400">
          Performance and voice-of-customer insights per traffic source
        </p>
      </div>

      {/* Insight callouts */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topByTraffic && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                Top Traffic Source
              </p>
              <p className="text-lg font-bold text-indigo-800">
                {topByTraffic.utm_source || '(direct)'}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                {totalSessions > 0
                  ? `${((topByTraffic.session_count / totalSessions) * 100).toFixed(0)}% of total traffic`
                  : ''}
              </p>
            </div>
          )}
          {topByRevenue && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                Top Revenue Source
              </p>
              <p className="text-lg font-bold text-emerald-800">
                {topByRevenue.utm_source || '(direct)'}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {totalRevenue > 0
                  ? `${((topByRevenue.total_revenue / totalRevenue) * 100).toFixed(0)}% of total revenue`
                  : ''}
              </p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
              Total Revenue
            </p>
            <p className="text-lg font-bold text-amber-800">
              ₹{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Across {data.length} channels
            </p>
          </div>
        </div>
      )}

      <ChannelVoC data={data} loading={loading} />
    </div>
  );
}
