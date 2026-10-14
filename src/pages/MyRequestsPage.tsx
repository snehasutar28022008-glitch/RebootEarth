import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ComponentRequest, Component } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  Pending: { label: 'Pending', icon: Clock, cls: 'bg-amber-light/20 text-amber-dark' },
  Approved: { label: 'Approved', icon: CheckCircle, cls: 'bg-forest-50 text-forest-600' },
  Rejected: { label: 'Rejected', icon: XCircle, cls: 'bg-red-50 text-hazard' },
};

export function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(ComponentRequest & { component_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('component_requests')
        .select('*, components!inner(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setRequests([]);
      } else {
        const rows = (data ?? []).map((r: Record<string, unknown>) => ({
          ...(r as unknown as ComponentRequest),
          component_name: (r as Record<string, { name: string }>)?.components?.name ?? 'Unknown',
        }));
        setRequests(rows);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <PageHeader title="My Requests" subtitle="Track the status of your component requests" icon={ClipboardList} />

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests yet"
          message="Browse the Components page and request what you need for your project."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => {
            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.Pending;
            const SIcon = sc.icon;
            return (
              <div key={r.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-forest-800 truncate">{r.component_name}</h3>
                    <p className="text-xs text-forest-500 mt-0.5">Qty: {r.quantity}</p>
                    {r.purpose && <p className="text-xs text-forest-600 mt-1">{r.purpose}</p>}
                    <p className="text-[10px] text-forest-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${sc.cls}`}>
                    <SIcon className="h-3 w-3" /> {sc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
