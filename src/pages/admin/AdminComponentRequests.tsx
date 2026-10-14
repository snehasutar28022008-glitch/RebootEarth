import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ComponentRequest, Component } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { ClipboardCheck, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

interface RequestWithDetails extends ComponentRequest {
  component_name: string;
  user_name: string;
}

const STATUS_CLS: Record<string, string> = {
  Pending: 'bg-amber-light/20 text-amber-dark',
  Approved: 'bg-forest-50 text-forest-600',
  Rejected: 'bg-red-50 text-hazard',
};

export function AdminComponentRequests() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = async () => {
    const [{ data: reqData, error }, { data: compData }] = await Promise.all([
      supabase.from('component_requests').select('*, components!inner(name)').order('created_at', { ascending: false }),
      supabase.from('components').select('*'),
    ]);
    if (error) {
      showToast('Failed to load requests', 'error');
      setLoading(false);
      return;
    }
    // Fetch user names
    const userIds = [...new Set((reqData ?? []).map((r: Record<string, unknown>) => (r as Record<string, string>).user_id))];
    let nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
      nameMap = new Map((profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
    }
    const rows = (reqData ?? []).map((r: Record<string, unknown>) => ({
      ...(r as unknown as ComponentRequest),
      component_name: (r as Record<string, { name: string }>)?.components?.name ?? 'Unknown',
      user_name: nameMap.get((r as Record<string, string>).user_id) ?? 'Unknown',
    }));
    setRequests(rows);
    setComponents((compData ?? []) as Component[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req: RequestWithDetails) => {
    setActionId(req.id);
    // Re-check stock
    const comp = components.find((c) => c.id === req.component_id);
    if (!comp) {
      showToast('Component not found', 'error');
      setActionId(null);
      return;
    }
    if (comp.quantity < req.quantity) {
      showToast(`Not enough stock. Available: ${comp.quantity}, requested: ${req.quantity}`, 'error');
      setActionId(null);
      return;
    }
    // Reduce quantity
    const { error: updateError } = await supabase
      .from('components')
      .update({ quantity: comp.quantity - req.quantity, updated_at: new Date().toISOString() })
      .eq('id', comp.id);
    if (updateError) {
      showToast(updateError.message, 'error');
      setActionId(null);
      return;
    }
    // Update request status
    const { error: reqError } = await supabase
      .from('component_requests')
      .update({ status: 'Approved' })
      .eq('id', req.id);
    setActionId(null);
    if (reqError) {
      showToast(reqError.message, 'error');
      return;
    }
    showToast('Request approved and stock updated', 'success');
    fetchRequests();
  };

  const handleReject = async (req: RequestWithDetails) => {
    setActionId(req.id);
    const { error } = await supabase
      .from('component_requests')
      .update({ status: 'Rejected' })
      .eq('id', req.id);
    setActionId(null);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Request rejected', 'success');
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button onClick={() => navigate('/admin')} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600">
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Component Requests" subtitle="Approve or reject student component requests" icon={ClipboardCheck} />

      {requests.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No requests yet" message="Student component requests will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-sm font-bold text-forest-800">{r.component_name}</h3>
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status] || STATUS_CLS.Pending}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-forest-500 mt-1">
                    {r.user_name} &middot; Qty: {r.quantity} &middot; {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.purpose && <p className="text-xs text-forest-600 mt-1">Purpose: {r.purpose}</p>}
                </div>
                {r.status === 'Pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(r)}
                      disabled={actionId === r.id}
                      className="rounded-lg bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-600 hover:bg-forest-100 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4 inline" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(r)}
                      disabled={actionId === r.id}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-hazard hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4 inline" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
