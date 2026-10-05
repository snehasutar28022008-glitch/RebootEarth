import { useEffect, useState } from 'react';
import { supabase, type StockEntry } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { Boxes, ArrowLeft, AlertTriangle, Weight, Package } from 'lucide-react';

export function AdminStock() {
  const { navigate } = useRouter();
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('stock_entries')
          .select('*')
          .order('created_at', { ascending: false });
        if (err) {
          setError(err.message);
        } else {
          setStock((data ?? []) as StockEntry[]);
        }
      } catch {
        setError('Failed to load stock data');
      }
      setLoading(false);
    })();
  }, []);

  const inStock = stock.filter((s) => s.status === 'in_stock');
  const totalWeight = inStock.reduce((sum, s) => sum + s.weight_kg, 0);
  const totalItems = inStock.reduce((sum, s) => sum + s.item_count, 0);
  const byCategory = inStock.reduce<Record<string, { weight: number; items: number }>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = { weight: 0, items: 0 };
    acc[s.category].weight += s.weight_kg;
    acc[s.category].items += s.item_count;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Stock Dashboard" subtitle="Collected e-waste inventory by category" icon={Boxes} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
            <Weight className="h-5 w-5 text-forest-500" />
          </div>
          <p className="font-display text-2xl font-bold text-forest-800">{totalWeight.toFixed(2)} kg</p>
          <p className="text-sm text-forest-600">Total Weight In Stock</p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
            <Package className="h-5 w-5 text-forest-500" />
          </div>
          <p className="font-display text-2xl font-bold text-forest-800">{totalItems}</p>
          <p className="text-sm text-forest-600">Total Items In Stock</p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
            <Boxes className="h-5 w-5 text-forest-500" />
          </div>
          <p className="font-display text-2xl font-bold text-forest-800">{Object.keys(byCategory).length}</p>
          <p className="text-sm text-forest-600">Categories</p>
        </div>
      </div>

      {stock.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No stock entries yet"
          message="Collected e-waste will appear here as inventory once pickups are completed and graded. Stock entries are created during the grading process."
        />
      ) : (
        <div className="card">
          <h3 className="mb-4 font-display text-sm font-bold text-forest-800">Stock by Category</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest-100 text-left text-xs text-forest-500">
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Weight (kg)</th>
                  <th className="pb-2 pr-4 font-medium">Items</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byCategory).map(([category, data]) => (
                  <tr key={category} className="border-b border-forest-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-forest-800">{category}</td>
                    <td className="py-2.5 pr-4 text-forest-600">{data.weight.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-forest-600">{data.items}</td>
                    <td className="py-2.5"><span className="rounded-lg bg-forest-50 px-2 py-0.5 text-xs font-semibold text-forest-700">In Stock</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
