import { useState, useEffect } from 'react';
import { useBrand } from '../App';
import { fetchObjections, Objection } from '../api/client';
import CompetitorIntel from '../components/CompetitorIntel';

export default function CompetitorsPage() {
  const { selectedBrandId } = useBrand();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchObjections(selectedBrandId)
      .then(setObjections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Competitor Intelligence</h2>
        <p className="text-sm text-gray-400">
          How competitors are being mentioned and compared in customer conversations
        </p>
      </div>

      <CompetitorIntel objections={objections} loading={loading} />
    </div>
  );
}
