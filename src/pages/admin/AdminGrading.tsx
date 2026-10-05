import { useEffect, useState } from 'react';
import { supabase, type Pickup } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  ClipboardCheck, ArrowLeft, AlertTriangle, Package, ChevronDown, ChevronUp,
} from 'lucide-react';

interface PickupWithUser extends Pickup {
  user_name: string;
}

export function AdminGrading() {
  const { navigate } = useRouter();
  const [pickups, setPickups] = useState<PickupWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('pickups')
          .select('*')
          .in('status', ['collected', 'scheduled', 'confirmed'])
          .order('created_at', { ascending: false });

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        const rows = (data ?? []) as Pickup[];
        if (rows.length === 0) {
          setPickups([]);
          setLoading(false);
          return;
        }

        const userIds = [...new Set(rows.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

        setPickups(rows.map((r) => ({ ...r, user_name: nameMap.get(r.user_id) ?? 'Unknown' })));
      } catch {
        setError('Failed to load pickups for grading');
      }
      setLoading(false);
    })();
  }, []);

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

      <PageHeader title="Inspection & Grading" subtitle="Grade collected items and confirm final values" icon={ClipboardCheck} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      {pickups.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No items ready for grading"
          message="Pickups that are collected or scheduled will appear here for inspection and grading. Collect some pickups first to begin grading."
        />
      ) : (
        <div className="space-y-3">
          {pickups.map((pickup) => (
            <div key={pickup.id} className="card">
              <button
                onClick={() => setExpandedId(expandedId === pickup.id ? null : pickup.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
                    <Package className="h-5 w-5 text-forest-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-800">{pickup.user_name}</p>
                    <p className="text-xs text-forest-500">
                      {pickup.total_items} items &middot; {pickup.city || 'No city'} &middot; {new Date(pickup.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {expandedId === pickup.id ? <ChevronUp className="h-5 w-5 text-forest-400" /> : <ChevronDown className="h-5 w-5 text-forest-400" />}
              </button>

              {expandedId === pickup.id && (
                <div className="mt-4 border-t border-forest-50 pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-forest-50/50 p-3">
                      <p className="text-xs text-forest-500">Total Items</p>
                      <p className="font-display text-lg font-bold text-forest-800">{pickup.total_items}</p>
                    </div>
                    <div className="rounded-lg bg-forest-50/50 p-3">
                      <p className="text-xs text-forest-500">Est. Min</p>
                      <p className="font-display text-lg font-bold text-forest-800">₹{pickup.estimated_value_min}</p>
                    </div>
                    <div className="rounded-lg bg-forest-50/50 p-3">
                      <p className="text-xs text-forest-500">Est. Max</p>
                      <p className="font-display text-lg font-bold text-forest-800">₹{pickup.estimated_value_max}</p>
                    </div>
                    <div className="rounded-lg bg-forest-50/50 p-3">
                      <p className="text-xs text-forest-500">Hazardous</p>
                      <p className="font-display text-lg font-bold text-forest-800">{pickup.has_hazardous ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-forest-200 p-4">
                    <p className="mb-2 text-xs font-semibold text-forest-700">Record Final Weight & Value</p>
                    <p className="text-xs text-forest-500">
                      This feature will allow you to enter the actual weight, grade each item, and confirm the final payment.
                      The grading form will be connected once pickups flow through the system.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
