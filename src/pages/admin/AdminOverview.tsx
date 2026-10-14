import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  LayoutDashboard, Package, Weight, Users, Clock, AlertTriangle,
  ArrowLeft, TrendingUp, Recycle,
} from 'lucide-react';

interface OverviewStats {
  pendingPickups: number;
  totalItems: number;
  totalCollectedKg: number;
  activeUsers: number;
  recentPickups: {
    id: string;
    status: string;
    total_items: number;
    created_at: string;
    city: string;
    user_name: string;
  }[];
}

export function AdminOverview() {
  const { navigate } = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [
          { count: pendingPickups, error: e1 },
          { data: pickupsData, error: e2 },
          { count: activeUsers, error: e3 },
        ] = await Promise.all([
          supabase.from('pickups').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'scheduled']),
          supabase.from('pickups').select('id, status, total_items, created_at, city, user_id, collected_weight_kg').order('created_at', { ascending: false }).limit(10),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ]);

        if (e1 || e2 || e3) {
          setError('Failed to load some statistics');
        }

        let totalItems = 0;
        let totalCollectedKg = 0;

        if (pickupsData) {
          totalItems = pickupsData.reduce((sum: number, p: { total_items?: number }) => sum + (p.total_items || 0), 0);
          const completed = pickupsData.filter((p: { status: string }) => p.status === 'completed');
          totalCollectedKg = completed.reduce((sum: number, p: { collected_weight_kg?: number | null }) => sum + (p.collected_weight_kg || 0), 0);
        }

        let recentPickups: OverviewStats['recentPickups'] = [];
        if (pickupsData && pickupsData.length > 0) {
          const userIds = [...new Set(pickupsData.map((p: { user_id: string }) => p.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          const nameMap = new Map((profilesData ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
          recentPickups = pickupsData.map((p: {
            id: string; status: string; total_items: number; created_at: string; city: string; user_id: string;
          }) => ({
            id: p.id,
            status: p.status,
            total_items: p.total_items,
            created_at: p.created_at,
            city: p.city || '',
            user_name: nameMap.get(p.user_id) || 'Unknown',
          }));
        }

        setStats({
          pendingPickups: pendingPickups ?? 0,
          totalItems,
          totalCollectedKg,
          activeUsers: activeUsers ?? 0,
          recentPickups,
        });
      } catch {
        setError('Failed to load overview data');
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

  if (error) {
    return (
      <div className="container-max section-padding">
        <PageHeader title="Admin Overview" subtitle="Dashboard statistics" icon={LayoutDashboard} />
        <EmptyState icon={AlertTriangle} title="Could not load data" message={error} />
      </div>
    );
  }

  const statCards = [
    { label: 'Pending Pickups', value: stats?.pendingPickups ?? 0, icon: Clock, color: 'text-amber-dark bg-amber-light/20' },
    { label: 'Total Items', value: stats?.totalItems ?? 0, icon: Package, color: 'text-forest-600 bg-forest-50' },
    { label: 'Collected (kg)', value: `${stats?.totalCollectedKg ?? 0} kg`, icon: Weight, color: 'text-emerald-700 bg-mint/40' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Users, color: 'text-blue-700 bg-blue-50' },
  ];

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Overview" subtitle="Real-time dashboard statistics" icon={LayoutDashboard} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-forest-800">{card.value}</p>
              <p className="text-sm text-forest-600 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-forest-500" />
          <h2 className="font-display text-lg font-bold text-forest-800">Recent Pickup Requests</h2>
        </div>

        {stats && stats.recentPickups.length > 0 ? (
          <div className="divide-y divide-forest-50">
            {stats.recentPickups.map((pickup) => (
              <div key={pickup.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50">
                    <Recycle className="h-4 w-4 text-forest-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-forest-800">{pickup.user_name}</p>
                    <p className="text-xs text-forest-500">
                      {pickup.total_items} items &middot; {pickup.city || 'No city'} &middot; {new Date(pickup.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={pickup.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No pickup requests yet"
            message="Pickup requests will appear here once users start booking collections."
            action={
              <button onClick={() => navigate('/admin/pickups')} className="btn-primary text-sm">
                Go to Pickup Requests
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-light/20 text-amber-dark',
    confirmed: 'bg-blue-50 text-blue-700',
    scheduled: 'bg-forest-50 text-forest-600',
    collected: 'bg-mint/40 text-emerald-700',
    completed: 'bg-forest-500 text-white',
    cancelled: 'bg-red-50 text-hazard',
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${colors[status] || 'bg-forest-50 text-forest-600'}`}>
      {label}
    </span>
  );
}
