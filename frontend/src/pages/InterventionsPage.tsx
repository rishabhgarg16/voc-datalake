import { useState, useEffect } from 'react';
import { useBrand } from '../App';
import { fetchInterventions, Intervention } from '../api/client';
import InterventionStats from '../components/InterventionStats';

export default function InterventionsPage() {
  const { selectedBrandId } = useBrand();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchInterventions(selectedBrandId)
      .then(setInterventions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Interventions & Nudges</h2>
        <p className="text-sm text-gray-400">
          Performance of proactive nudges and their impact on conversion
        </p>
      </div>

      {/* Summary */}
      {!loading && interventions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Triggered
            </p>
            <p className="text-2xl font-bold text-brand-600">
              {interventions.reduce((s, i) => s + i.triggered_count, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Led to Chat
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {interventions.reduce((s, i) => s + i.chat_after, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Led to Order
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {interventions.reduce((s, i) => s + i.order_after, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Avg Conv Lift
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {interventions.length > 0
                ? `+${(
                    interventions.reduce((s, i) => s + i.conversion_lift, 0) /
                    interventions.length
                  ).toFixed(1)}%`
                : '--'}
            </p>
          </div>
        </div>
      )}

      <InterventionStats interventions={interventions} loading={loading} />
    </div>
  );
}
