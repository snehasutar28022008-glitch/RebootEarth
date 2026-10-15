import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Company, PassportEvent, PassportStage } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  ClipboardList, ArrowLeft, AlertTriangle, Package, MapPin, Phone, Calendar,
  Clock, CheckCircle, XCircle, Building2, Award, Search, ChevronDown, ChevronUp,
  Stamp, Plus,
} from 'lucide-react';

interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  user_name: string;
  user_email: string;
}

const PASSPORT_STAGES: PassportStage[] = ['Submitted', 'Picked Up', 'Inspected', 'Recovery Decision', 'Recycled', 'Recovered'];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  admin_approved: 'Admin Approved',
  waiting_company_approval: 'Waiting Partner Approval',
  company_approved: 'Partner Approved',
  rejected: 'Rejected',
  collected: 'Collected',
};

const STATUS_CLASSES: Record<string, string> = {
  submitted: 'bg-amber-light/20 text-amber-dark',
  admin_approved: 'bg-blue-50 text-blue-700',
  waiting_company_approval: 'bg-amber-light/20 text-amber-dark',
  company_approved: 'bg-forest-50 text-forest-600',
  rejected: 'bg-red-50 text-hazard',
  collected: 'bg-forest-500 text-white',
};

export function AdminOrders() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [passportEvents, setPassportEvents] = useState<Record<string, PassportEvent[]>>({});
  const [passportNote, setPassportNote] = useState<Record<string, string>>({});
  const [passportLoading, setPassportLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [
          { data: ordersData, error: oe },
          { data: companiesData, error: ce },
        ] = await Promise.all([
          supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
          supabase.from('companies').select('*').order('name'),
        ]);

        if (oe || ce) {
          setError(oe?.message || ce?.message || 'Failed to load');
          setLoading(false);
          return;
        }

        const rows = (ordersData ?? []) as OrderWithDetails[];
        if (rows.length > 0) {
          const userIds = [...new Set(rows.map((r) => r.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);
          const pMap = new Map((profiles ?? []).map((p: { id: string; name: string; email: string }) => [p.id, p]));
          rows.forEach((r) => {
            r.user_name = pMap.get(r.user_id)?.name ?? 'Unknown';
            r.user_email = pMap.get(r.user_id)?.email ?? '';
          });
        }

        setOrders(rows);
        setCompanies((companiesData ?? []) as Company[]);

        // Fetch passport events for all orders
        if (rows.length > 0) {
          const orderIds = rows.map((r) => r.id);
          const { data: eventsData } = await supabase
            .from('passport_events')
            .select('*')
            .in('request_id', orderIds)
            .order('created_at', { ascending: true });
          const eventMap: Record<string, PassportEvent[]> = {};
          (eventsData ?? []).forEach((e: Record<string, unknown>) => {
            const ev = e as unknown as PassportEvent;
            const key = ev.request_id || ev.pickup_id;
            if (!key) return;
            if (!eventMap[key]) eventMap[key] = [];
            eventMap[key].push(ev);
          });
          setPassportEvents(eventMap);
        }
      } catch {
        setError('Failed to load orders');
      }
      setLoading(false);
    })();
  }, []);

  const updateOrder = async (id: string, updates: Record<string, string | number | null>) => {
    setActionLoading(id);
    const { error: ue } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    setActionLoading(null);
    if (ue) {
      showToast(ue.message, 'error');
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    showToast('Order updated', 'success');
  };

  const handleApprove = (order: OrderWithDetails) => {
    if (order.has_special_request) {
      updateOrder(order.id, { status: 'waiting_company_approval' });
    } else {
      updateOrder(order.id, { status: 'admin_approved' });
    }
  };

  const handleSendToCompany = (order: OrderWithDetails) => {
    if (!order.company_id) {
      showToast('Please assign a company first', 'warning');
      return;
    }
    updateOrder(order.id, { status: 'waiting_company_approval' });
  };

  const handleCompanyApproved = (order: OrderWithDetails) => {
    updateOrder(order.id, { status: 'company_approved' });
  };

  const handleReject = (order: OrderWithDetails) => {
    const reason = rejectReason[order.id] || '';
    if (!reason.trim()) {
      showToast('Please enter a rejection reason', 'warning');
      return;
    }
    updateOrder(order.id, { status: 'rejected', rejection_reason: reason });
    setRejectReason((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
  };

  const handleCollect = (order: OrderWithDetails) => {
    const pts = parseInt(pointsInput[order.id] || '0', 10);
    updateOrder(order.id, { status: 'collected', points_awarded: pts });

    if (pts > 0) {
      supabase.rpc('add_points', { p_user_id: order.user_id, p_points: pts }).then(({ error: pe }) => {
        if (pe) {
          supabase.from('profiles').update({ points: pts, updated_at: new Date().toISOString() }).eq('id', order.user_id).then(() => {});
        }
      });
    }
  };

  const handleAssignCompany = (order: OrderWithDetails, companyId: string) => {
    updateOrder(order.id, { company_id: companyId || null });
  };

  const getNextStage = (orderId: string): PassportStage | null => {
    const events = passportEvents[orderId] || [];
    const completed = new Set(events.map((e) => e.stage));
    for (const stage of PASSPORT_STAGES) {
      if (!completed.has(stage)) return stage;
    }
    return null;
  };

  const handleAddPassportStage = async (order: OrderWithDetails) => {
    const nextStage = getNextStage(order.id);
    if (!nextStage) {
      showToast('All stages are already completed', 'warning');
      return;
    }
    setPassportLoading(order.id);
    const note = (passportNote[order.id] || '').trim();
    const { error: pe } = await supabase.from('passport_events').insert({
      request_id: order.id,
      stage: nextStage,
      note,
    });
    setPassportLoading(null);
    if (pe) {
      showToast(pe.message, 'error');
      return;
    }
    // Refetch events for this order
    const { data: newEvents } = await supabase
      .from('passport_events')
      .select('*')
      .eq('request_id', order.id)
      .order('created_at', { ascending: true });
    setPassportEvents((prev) => ({ ...prev, [order.id]: (newEvents ?? []) as PassportEvent[] }));
    setPassportNote((prev) => { const next = { ...prev }; delete next[order.id]; return next; });
    showToast(`Stage "${nextStage}" added`, 'success');
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.user_name.toLowerCase().includes(search.toLowerCase()) ||
      o.user_email.toLowerCase().includes(search.toLowerCase()) ||
      o.pickup_address.toLowerCase().includes(search.toLowerCase()) ||
      o.pickup_phone.includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
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

      <PageHeader title="Orders" subtitle="Manage pickup orders, approvals, and company assignment" icon={ClipboardList} />

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
            placeholder="Search by name, email, phone, or address..."
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
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={orders.length === 0 ? "No orders yet" : "No matching results"}
          message={orders.length === 0 ? "Orders will appear here automatically when users check out." : "Try adjusting your search or filter."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isNew = order.status === 'submitted';
            const isExpanded = expandedId === order.id;
            return (
              <div
                key={order.id}
                className={`card animate-fade-in-up ${isNew ? 'ring-2 ring-forest-400/40' : ''}`}
              >
                {/* Order header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isNew ? 'bg-forest-500' : 'bg-forest-50'}`}>
                      <Package className={`h-5 w-5 ${isNew ? 'text-white' : 'text-forest-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.passport_id && (
                          <span className="rounded-lg bg-forest-800 px-2 py-0.5 text-xs font-bold text-white font-mono">{order.passport_id}</span>
                        )}
                        <h3 className="font-display text-sm font-bold text-forest-800 truncate">{order.user_name}</h3>
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${STATUS_CLASSES[order.status] || 'bg-forest-50 text-forest-600'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        {isNew && (
                          <span className="rounded-lg bg-forest-500 px-2 py-0.5 text-xs font-bold text-white animate-pulse">NEW</span>
                        )}
                        {order.has_hazardous && (
                          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-hazard">Hazard</span>
                        )}
                        {order.has_special_request && (
                          <span className="rounded-lg bg-amber-light/20 px-2 py-0.5 text-xs font-semibold text-amber-dark">Special</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-forest-600 mt-1">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.total_items} items</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.pickup_phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.pickup_address.slice(0, 30)}{order.pickup_address.length > 30 ? '...' : ''}</span>
                        <span className="text-forest-400">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-forest-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-forest-400 flex-shrink-0" />}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 border-t border-forest-50 pt-4 space-y-4">
                    {/* User & pickup details */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-forest-50/50 p-3">
                        <p className="text-xs font-semibold text-forest-700 mb-1">Customer</p>
                        <p className="text-sm text-forest-800">{order.user_name}</p>
                        <p className="text-xs text-forest-500">{order.user_email}</p>
                        <p className="text-xs text-forest-500">{order.pickup_phone}</p>
                      </div>
                      <div className="rounded-lg bg-forest-50/50 p-3">
                        <p className="text-xs font-semibold text-forest-700 mb-1">Pickup Details</p>
                        <p className="text-xs text-forest-600">{order.pickup_address}</p>
                        {order.pickup_date && (
                          <p className="text-xs text-forest-600 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {order.pickup_date} {order.pickup_slot}
                          </p>
                        )}
                        <p className="text-xs text-forest-400 mt-1">Est: ₹{order.estimated_value_min}–₹{order.estimated_value_max}</p>
                      </div>
                    </div>

                    {/* Items with photos */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-forest-700 mb-2">Items ({order.order_items.length})</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {order.order_items.map((oi) => (
                            <div key={oi.id} className="flex items-center gap-3 rounded-lg border border-forest-50 p-2">
                              {oi.image_url ? (
                                <img src={oi.image_url} alt={oi.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-forest-50 flex-shrink-0">
                                  <Package className="h-5 w-5 text-forest-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-forest-800 truncate">{oi.quantity}x {oi.name}</p>
                                <p className="text-[10px] text-forest-400">{oi.category} &middot; Grade {oi.grade}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejection reason display */}
                    {order.status === 'rejected' && order.rejection_reason && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-hazard">
                        <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>Rejection reason: {order.rejection_reason}</span>
                      </div>
                    )}

                    {/* Company assignment */}
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-forest-500 flex-shrink-0" />
                      <label className="text-xs font-medium text-forest-700">Assigned Company:</label>
                      <select
                        value={order.company_id || ''}
                        onChange={(e) => handleAssignCompany(order, e.target.value)}
                        disabled={actionLoading === order.id}
                        className="flex-1 rounded-lg border-2 border-forest-200 bg-white px-3 py-1.5 text-xs font-medium text-forest-700 focus:border-forest-400 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Not assigned</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} — {c.area}</option>
                        ))}
                      </select>
                    </div>

                    {/* Approval actions */}
                    <div className="flex flex-wrap gap-2">
                      {/* Normal items: Approve */}
                      {order.status === 'submitted' && !order.has_special_request && (
                        <button
                          onClick={() => handleApprove(order)}
                          disabled={actionLoading === order.id}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                      )}

                      {/* Special request: Approve (sends to company) */}
                      {order.status === 'submitted' && order.has_special_request && (
                        <button
                          onClick={() => handleApprove(order)}
                          disabled={actionLoading === order.id}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve & Send to Company
                        </button>
                      )}

                      {/* Waiting for company: Company Approved / Reject */}
                      {order.status === 'waiting_company_approval' && (
                        <>
                          <button
                            onClick={() => handleCompanyApproved(order)}
                            disabled={actionLoading === order.id}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" /> Mark Company Approved
                          </button>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Rejection reason..."
                              value={rejectReason[order.id] || ''}
                              onChange={(e) => setRejectReason((prev) => ({ ...prev, [order.id]: e.target.value }))}
                              className="rounded-lg border-2 border-forest-200 px-3 py-1.5 text-xs focus:border-forest-400 focus:outline-none w-48"
                            />
                            <button
                              onClick={() => handleReject(order)}
                              disabled={actionLoading === order.id}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-hazard hover:bg-red-100 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4 inline" /> Reject
                            </button>
                          </div>
                        </>
                      )}

                      {/* Admin approved: Mark collected */}
                      {order.status === 'admin_approved' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Points to award"
                            value={pointsInput[order.id] || ''}
                            onChange={(e) => setPointsInput((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            className="w-32 rounded-lg border-2 border-forest-200 px-3 py-1.5 text-xs focus:border-forest-400 focus:outline-none"
                          />
                          <button
                            onClick={() => handleCollect(order)}
                            disabled={actionLoading === order.id}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            <Award className="h-4 w-4" /> Mark Collected
                          </button>
                        </div>
                      )}

                      {/* Company approved: Mark collected */}
                      {order.status === 'company_approved' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Points to award"
                            value={pointsInput[order.id] || ''}
                            onChange={(e) => setPointsInput((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            className="w-32 rounded-lg border-2 border-forest-200 px-3 py-1.5 text-xs focus:border-forest-400 focus:outline-none"
                          />
                          <button
                            onClick={() => handleCollect(order)}
                            disabled={actionLoading === order.id}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            <Award className="h-4 w-4" /> Mark Collected
                          </button>
                        </div>
                      )}

                      {/* Collected: show points */}
                      {order.status === 'collected' && order.points_awarded > 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-forest-50 px-3 py-1.5 text-xs text-forest-700">
                          <Award className="h-4 w-4" /> {order.points_awarded} points awarded
                        </div>
                      )}
                    </div>

                    {/* Update Passport */}
                    <div className="rounded-lg border border-forest-100 bg-forest-50/30 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Stamp className="h-4 w-4 text-forest-500" />
                        <p className="text-xs font-semibold text-forest-700">E-Waste Passport</p>
                        {(passportEvents[order.id] || []).map((e) => (
                          <span key={e.id} className="rounded bg-forest-100 px-1.5 py-0.5 text-[10px] font-medium text-forest-600">{e.stage}</span>
                        ))}
                      </div>
                      {(() => {
                        const nextStage = getNextStage(order.id);
                        if (!nextStage) {
                          return <p className="text-xs text-forest-500">All stages completed.</p>;
                        }
                        return (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="Optional note..."
                              value={passportNote[order.id] || ''}
                              onChange={(e) => setPassportNote((prev) => ({ ...prev, [order.id]: e.target.value }))}
                              className="flex-1 min-w-32 rounded-lg border-2 border-forest-200 bg-white px-3 py-1.5 text-xs focus:border-forest-400 focus:outline-none"
                            />
                            <button
                              onClick={() => handleAddPassportStage(order)}
                              disabled={passportLoading === order.id}
                              className="rounded-lg bg-forest-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-600 disabled:opacity-50"
                            >
                              <Plus className="h-3 w-3 inline" /> Add: {nextStage}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
