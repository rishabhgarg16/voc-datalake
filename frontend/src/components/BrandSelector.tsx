import { useBrand } from '../App';

export default function BrandSelector() {
  const { brands, selectedBrandId, setSelectedBrandId } = useBrand();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500 font-medium">Brand:</label>
      <select
        value={selectedBrandId ?? ''}
        onChange={(e) => setSelectedBrandId(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      >
        {brands.length === 0 && (
          <option value="">Loading...</option>
        )}
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.display_name}
          </option>
        ))}
      </select>
    </div>
  );
}
