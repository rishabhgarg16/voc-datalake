import { useState, useEffect } from 'react';
import { useBrand } from '../App';
import {
  fetchObjections,
  fetchNonBuyers,
  fetchInfoGaps,
  Objection,
  NonBuyer,
  InfoGap,
} from '../api/client';
import NonBuyerInsights from '../components/NonBuyerInsights';
import InfoGaps from '../components/InfoGaps';

export default function VoCPage() {
  const { selectedBrandId } = useBrand();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [nonBuyers, setNonBuyers] = useState<NonBuyer[]>([]);
  const [infoGaps, setInfoGaps] = useState<InfoGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    Promise.all([
      fetchObjections(selectedBrandId),
      fetchNonBuyers(selectedBrandId),
      fetchInfoGaps(selectedBrandId),
    ])
      .then(([obj, nb, ig]) => {
        setObjections(obj);
        setNonBuyers(nb);
        setInfoGaps(ig);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Non-Buyer Intelligence</h2>
        <p className="text-sm text-gray-400">
          Understand why visitors are not converting and what blocks purchases
        </p>
      </div>

      <NonBuyerInsights objections={objections} nonBuyers={nonBuyers} loading={loading} />

      <InfoGaps gaps={infoGaps} loading={loading} />
    </div>
  );
}
