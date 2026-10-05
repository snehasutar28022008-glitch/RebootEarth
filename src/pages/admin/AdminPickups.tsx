import { useEffect, useState } from 'react';
import { supabase, type Pickup } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  Truck, ArrowLeft, Search, AlertTriangle, Package, MapPin, Calendar,
} from 'lucide-react';

interface PickupWithUser extends Pickup {
  user_name: string;
  user_email: string;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'scheduled', 'collected', 'completed', 'cancelled'];

export function AdminPickups() {
  const { navigate } = useRouter();
  const [pickups, setPickups] = useState<PickupWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('pickups')
          .select('*')
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
          .select('id, name, email')
          .in('id', userIds);
        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

        const enriched: PickupWithUser[] = rows.map((r) => ({
          ...r,
          user_name: profileMap.get(r.user_id)?.name ?? 'Unknown',
          user_email: profileMap.get(r.user_id)?.email ?? '',
        }));
        setPickups(enriched);
      } catch {
        setError('Failed to load pickup requests');
      }
      setLoading(false);
    })();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error: updateErr } = await supabase
      .from('pickups')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    setUpdatingId(null);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setPickups((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus as Pickup['status'] } : p)));
  };

  const filtered = pickups.filter((p) => {
    const matchesSearch =
      !search ||
      p.user_name.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      <PageHeader title="Pickup Requests" subtitle="View and manage all incoming pickup requests" icon={Truck} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            placeholder="Search by name, email, city, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-forest-200 bg-white py-2.5 pl-10 pr-4 text-sm text-forest-800 placeholder-forest-400 focus:border-forest-400 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border-2 border-forest-200 bg-white px-4 py-2.5 text-sm text-forest-800 focus:border-forest-400 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={pickups.length === 0 ? "No pickup requests yet" : "No matching results"}
          message={pickups.length === 0 ? "Pickup requests will appear here once users book collections from the Add Items page." : "Try adjusting your search or filter."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((pickup) => (
            <div key={pickup.id} className="card animate-fade-in-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-sm font-bold text-forest-800">{pickup.user_name}</h3>
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(pickup.status)}`}>
                      {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                    </span>
                    {pickup.has_hazardous && (
                      <span className="rounded-lg bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-hazard">
                        Hazardous
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-forest-600">
                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {pickup.total_items} items</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pickup.city || 'No city'} {pickup.pincode}</span>
                    {pickup.scheduled_date && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {pickup.scheduled_date}</span>
                    )}
                    <span className="text-forest-400">{pickup.user_email}</span>
                  </div>
                  {pickup.address && (
                    <p className="text-xs text-forest-500">{pickup.address}</p>
                  )}
                  <p className="text-xs text-forest-400">
                    Est. value: ₹{pickup.estimated_value_min}–₀{pickup.estimated_value_max} &middot; {new Date(pickup.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={pickup.status}
                    onChange={(e) => handleStatusChange(pickup.id, e.target.value)}
                    disabled={updatingId === pickup.id}
                    className="rounded-lg border-2 border-forest-200 bg-white px-3 py-2 text-xs font-medium text-forest-700 focus:border-forest-400 focus:outline-none disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-light/20 text-amber-dark',
    confirmed: 'bg-blue-50 text-blue-700',
    scheduled: 'bg-forest-50 text-forest-600',
    collected: 'bg-mint/40 text-emerald-700',
    completed: 'bg-forest-500 text-white',
    cancelled: 'bg-red-50 text-hazard',
  };
  return map[status] || 'bg-forest-50 text-forest-600';
}
