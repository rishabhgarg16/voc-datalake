import { useState, useEffect } from 'react';
import { useBrand } from '../App';
import { fetchSegments, Segment } from '../api/client';
import PersonaCards from '../components/PersonaCards';

export default function PersonasPage() {
  const { selectedBrandId } = useBrand();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchSegments(selectedBrandId)
      .then(setSegments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Shopper Personas</h2>
        <p className="text-sm text-gray-400">
          Behavioral segments derived from session data and chat interactions
        </p>
      </div>

      {!loading && segments.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Segments
            </p>
            <p className="text-2xl font-bold text-brand-600">{segments.length}</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Shoppers
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {segments.reduce((s, seg) => s + seg.count, 0).toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Highest Conv Rate
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {Math.max(...segments.map((s) => s.conversion_rate)).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <PersonaCards segments={segments} loading={loading} />
    </div>
  );
}
