import { useState } from 'react';
import { Product } from '../api/client';

interface Props {
  products: Product[];
  loading: boolean;
}

export default function ProductIntelligence({ products, loading }: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-48" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No product data available</div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Product Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3 text-right">Views</th>
              <th className="px-6 py-3 text-right">Unique Sessions</th>
              <th className="px-6 py-3 text-right">Conv Rate</th>
              <th className="px-6 py-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <>
                <tr
                  key={p.product_handle}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === p.product_handle ? null : p.product_handle
                    )
                  }
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {p.product_handle}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {p.view_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {p.unique_sessions.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`font-semibold ${
                        p.conversion_rate >= 5
                          ? 'text-green-600'
                          : p.conversion_rate >= 2
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {p.conversion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-xs">
                    {expandedRow === p.product_handle ? '▲' : '▼'}
                  </td>
                </tr>
                {expandedRow === p.product_handle && (
                  <tr key={`${p.product_handle}-detail`}>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                            View-to-Session Ratio
                          </p>
                          <p className="font-bold text-gray-800">
                            {p.unique_sessions > 0
                              ? (p.view_count / p.unique_sessions).toFixed(1)
                              : '--'}
                            x
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                            Est. Orders
                          </p>
                          <p className="font-bold text-gray-800">
                            {Math.round(
                              p.unique_sessions * (p.conversion_rate / 100)
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                            Performance
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                p.conversion_rate >= 5
                                  ? 'bg-green-500'
                                  : p.conversion_rate >= 2
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(p.conversion_rate * 5, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
