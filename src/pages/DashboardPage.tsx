import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useBasket } from '@/context/BasketContext';
import { supabase, type Order, type OrderItem, type Company, type PassportEvent, type PassportStage } from '@/lib/supabase';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/ui';
import {
  Recycle, Truck, Wallet, Award, Package, ArrowRight, Sparkles, Plus, ShoppingCart,
  Clock, CheckCircle, AlertTriangle, XCircle, Building2, Calendar, MapPin, Phone,
  Stamp, ChevronDown, ChevronUp,
} from 'lucide-react';

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const PASSPORT_STAGES: PassportStage[] = ['Submitted', 'Picked Up', 'Inspected', 'Recovery Decision', 'Recycled', 'Recovered'];

export function DashboardPage() {
  const { navigate } = useRouter();
  const { profile, role } = useAuth();
  const { items, totalItems, totalValueMin, totalValueMax } = useBasket();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [passportEvents, setPassportEvents] = useState<Record<string, PassportEvent[]>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      setOrders((ordersData ?? []) as OrderWithItems[]);

      // Fetch passport events for all orders
      if ((ordersData ?? []).length > 0) {
        const orderIds = (ordersData ?? []).map((o: Record<string, unknown>) => (o as { id: string }).id);
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

      const { data: companiesData } = await supabase.from('companies').select('*');
      setCompanies((companiesData ?? []) as Company[]);
      setLoadingOrders(false);
    })();
  }, []);

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; class: string }> = {
    submitted: { label: 'Submitted', icon: Clock, class: 'bg-amber-light/20 text-amber-dark' },
    admin_approved: { label: 'Admin Approved', icon: CheckCircle, class: 'bg-blue-50 text-blue-700' },
    waiting_company_approval: { label: 'Waiting Partner Approval', icon: Clock, class: 'bg-amber-light/20 text-amber-dark' },
    company_approved: { label: 'Partner Approved', icon: CheckCircle, class: 'bg-forest-50 text-forest-600' },
    rejected: { label: 'Rejected', icon: XCircle, class: 'bg-red-50 text-hazard' },
    collected: { label: 'Collected', icon: Package, class: 'bg-forest-500 text-white' },
  };

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <PageHeader title={`Welcome, ${profile?.name?.split(' ')[0] || 'Recycler'}!`} subtitle="Your e-waste recycling dashboard" icon={Sparkles} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { icon: Recycle, label: 'kg recycled', value: '0', color: 'text-forest-500', bg: 'bg-forest-50' },
          { icon: Package, label: 'items', value: `${orders.reduce((s, o) => s + o.total_items, 0)}`, color: 'text-emerald-light', bg: 'bg-mint/40' },
          { icon: Wallet, label: 'wallet', value: `₹${profile?.wallet_balance?.toFixed(0) || '0'}`, color: 'text-amber-dark', bg: 'bg-amber-light/20' },
          { icon: Award, label: 'points', value: `${profile?.points || 0}`, color: 'text-forest-600', bg: 'bg-forest-100' },
        ].map((stat, i) => (
          <div key={i} className="card animate-fade-in-up text-center" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="font-display text-xl font-bold text-forest-800">{stat.value}</div>
            <p className="text-xs text-forest-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <button
          onClick={() => navigate('/add-items')}
          className="card card-hover group flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-forest-800">Add E-Waste Items</h3>
            <p className="text-xs text-forest-600">Add items to your pickup basket</p>
          </div>
          <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/add-items')}
          className="card card-hover group flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-light to-forest-500 shadow-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-forest-800">Schedule Pickup</h3>
            <p className="text-xs text-forest-600">Book a new e-waste collection</p>
          </div>
          <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/wallet')}
          className="card card-hover group flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-forest-800">Wallet & Rewards</h3>
            <p className="text-xs text-forest-600">View balance and history</p>
          </div>
          <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Current basket summary */}
      {items.length > 0 && (
        <div className="card mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
                <ShoppingCart className="h-5 w-5 text-forest-500" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-forest-800">Your Pickup Basket</h3>
                <p className="text-xs text-forest-600">{totalItems} item{totalItems !== 1 ? 's' : ''} • Est. ₹{totalValueMin}–₹{totalValueMax}</p>
              </div>
            </div>
            <button onClick={() => navigate('/add-items')} className="btn-secondary text-xs">
              Manage basket
            </button>
          </div>
        </div>
      )}

      {/* My Orders */}
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-forest-800 mb-4">My Orders</h2>

        {loadingOrders ? (
          <LoadingSpinner size="md" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            message="Place your first pickup order by adding e-waste items and checking out."
            action={
              <button onClick={() => navigate('/add-items')} className="btn-primary">
                <Plus className="h-4 w-4" /> Add E-Waste Items
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const sc = statusConfig[order.status] || statusConfig.submitted;
              const SIcon = sc.icon;
              const company = order.company_id ? companyMap.get(order.company_id) : null;
              const showCompany = order.status === 'company_approved' || order.status === 'collected';
              return (
                <div key={order.id} className={`card animate-fade-in-up ${order.status === 'submitted' ? 'ring-2 ring-forest-400/30' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.passport_id && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-forest-800 px-2 py-0.5 text-xs font-bold text-white font-mono">
                            <Stamp className="h-3 w-3" /> {order.passport_id}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${sc.class}`}>
                          <SIcon className="h-3 w-3" /> {sc.label}
                        </span>
                        {order.has_hazardous && (
                          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-hazard">Hazardous</span>
                        )}
                        <span className="text-xs text-forest-400">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-forest-600">
                        <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {order.total_items} items</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {order.pickup_address}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {order.pickup_phone}</span>
                        {order.pickup_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {order.pickup_date} {order.pickup_slot}</span>
                        )}
                      </div>

                      {order.status === 'rejected' && order.rejection_reason && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2 text-xs text-hazard">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Rejection reason: {order.rejection_reason}</span>
                        </div>
                      )}

                      {showCompany && company && (
                        <div className="flex items-center gap-2 text-xs text-forest-600">
                          <Building2 className="h-3.5 w-3.5" /> Assigned to: <span className="font-semibold text-forest-800">{company.name}</span>
                        </div>
                      )}

                      {!showCompany && order.status === 'waiting_company_approval' && (
                        <p className="text-xs text-amber-dark">Waiting for partner approval</p>
                      )}

                      {order.points_awarded > 0 && (
                        <div className="flex items-center gap-2 text-xs text-forest-600">
                          <Award className="h-3.5 w-3.5" /> Points earned: <span className="font-semibold text-forest-800">{order.points_awarded}</span>
                        </div>
                      )}

                      {/* Item thumbnails */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {order.order_items.slice(0, 6).map((oi) => (
                            <div key={oi.id} className="flex items-center gap-1 rounded-lg bg-forest-50/50 px-2 py-1 text-xs text-forest-600">
                              {oi.image_url ? (
                                <img src={oi.image_url} alt={oi.name} className="h-6 w-6 rounded object-cover" />
                              ) : (
                                <Package className="h-3.5 w-3.5 text-forest-400" />
                              )}
                              <span>{oi.quantity}x {oi.name.slice(0, 20)}{oi.name.length > 20 ? '...' : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-forest-500">Est. value</p>
                      <p className="font-display text-sm font-bold text-forest-800">₹{order.estimated_value_min}–₹{order.estimated_value_max}</p>
                    </div>
                  </div>

                  {/* Digital E-Waste Passport toggle */}
                  {order.passport_id && (
                    <div className="mt-3 border-t border-forest-50 pt-3">
                      <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600">
                          <Stamp className="h-3.5 w-3.5" /> Digital E-Waste Passport
                        </span>
                        {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4 text-forest-400" /> : <ChevronDown className="h-4 w-4 text-forest-400" />}
                      </button>

                      {expandedOrderId === order.id && (
                        <PassportTimeline events={passportEvents[order.id] || []} passportId={order.passport_id} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {role === 'admin' && (
        <div className="mt-6 rounded-2xl bg-forest-800 p-6 text-white">
          <h3 className="font-display text-lg font-semibold mb-2">Admin Access</h3>
          <p className="text-sm text-mint-light/80 mb-4">
            You have admin privileges. Visit the admin panel to manage orders, approvals, and more.
          </p>
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-forest-800 hover:bg-mint-light transition-all">
            Go to Admin Panel
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function PassportTimeline({ events, passportId }: { events: PassportEvent[]; passportId: string }) {
  const eventMap = new Map<string, PassportEvent>();
  events.forEach((e) => eventMap.set(e.stage, e));

  return (
    <div className="mt-3 rounded-xl bg-forest-50/30 p-4">
      <p className="mb-3 text-xs font-bold text-forest-700 font-mono">Passport ID: {passportId}</p>
      <div className="relative">
        {PASSPORT_STAGES.map((stage, i) => {
          const event = eventMap.get(stage);
          const isCompleted = !!event;
          const isLast = i === PASSPORT_STAGES.length - 1;
          return (
            <div key={stage} className="flex gap-3">
              {/* Line + dot */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 ${isCompleted ? 'bg-forest-500' : 'bg-gray-200'}`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-6 ${isCompleted ? 'bg-forest-300' : 'bg-gray-200'}`} />
                )}
              </div>
              {/* Content */}
              <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                <p className={`text-sm font-semibold ${isCompleted ? 'text-forest-800' : 'text-gray-400'}`}>{stage}</p>
                {isCompleted ? (
                  <>
                    <p className="text-xs text-forest-500 mt-0.5">{new Date(event.created_at).toLocaleString()}</p>
                    {event.note && <p className="text-xs text-forest-600 mt-1">{event.note}</p>}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
