import { useState, useEffect } from 'react';
import { useBrand } from '../App';
import { fetchProducts, Product } from '../api/client';
import ProductIntelligence from '../components/ProductIntelligence';

export default function ProductPage() {
  const { selectedBrandId } = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchProducts(selectedBrandId)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Product Intelligence</h2>
        <p className="text-sm text-gray-400">
          View counts, sessions, and conversion rates per product
        </p>
      </div>

      {/* Summary cards */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Products
            </p>
            <p className="text-2xl font-bold text-brand-600">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Views
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {products.reduce((s, p) => s + p.view_count, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Avg Conv Rate
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {products.length > 0
                ? (
                    products.reduce((s, p) => s + p.conversion_rate, 0) / products.length
                  ).toFixed(1)
                : '0'}
              %
            </p>
          </div>
        </div>
      )}

      <ProductIntelligence products={products} loading={loading} />
    </div>
  );
}
