import { useEffect, useState } from 'react';
import { supabase, type Handover } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  Truck, ArrowLeft, AlertTriangle, Plus, Save, X, Weight, Package, IndianRupee,
} from 'lucide-react';

export function AdminHandover() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ partner_name: '', total_weight_kg: '', total_items: '', total_value: '', notes: '' });

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('handovers')
          .select('*')
          .order('created_at', { ascending: false });
        if (err) {
          setError(err.message);
        } else {
          setHandovers((data ?? []) as Handover[]);
        }
      } catch {
        setError('Failed to load handovers');
      }
      setLoading(false);
    })();
  }, []);

  const handleCreate = async () => {
    const { data, error: insertErr } = await supabase
      .from('handovers')
      .insert({
        partner_name: form.partner_name,
        total_weight_kg: parseFloat(form.total_weight_kg) || 0,
        total_items: parseInt(form.total_items) || 0,
        total_value: parseFloat(form.total_value) || 0,
        notes: form.notes,
      })
      .select()
      .single();
    if (insertErr) {
      showToast(insertErr.message, 'error');
      return;
    }
    setHandovers((prev) => [data as Handover, ...prev]);
    setShowForm(false);
    setForm({ partner_name: '', total_weight_kg: '', total_items: '', total_value: '', notes: '' });
    showToast('Handover record created', 'success');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error: updateErr } = await supabase.from('handovers').update({ status: newStatus }).eq('id', id);
    if (updateErr) {
      showToast(updateErr.message, 'error');
      return;
    }
    setHandovers((prev) => prev.map((h) => (h.id === id ? { ...h, status: newStatus as Handover['status'] } : h)));
    showToast('Status updated', 'success');
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
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Company Handover" subtitle="Track batch handovers to recycling partners" icon={Truck} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Handover Record
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-forest-800">Create Handover Record</h3>
            <button onClick={() => setShowForm(false)} className="text-forest-400 hover:text-forest-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-700">Partner Name</label>
              <input
                type="text"
                value={form.partner_name}
                onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                placeholder="Recycling partner name"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-700">Total Weight (kg)</label>
              <input
                type="number"
                value={form.total_weight_kg}
                onChange={(e) => setForm({ ...form, total_weight_kg: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-700">Total Items</label>
              <input
                type="number"
                value={form.total_items}
                onChange={(e) => setForm({ ...form, total_items: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-700">Total Value (₹)</label>
              <input
                type="number"
                value={form.total_value}
                onChange={(e) => setForm({ ...form, total_value: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-forest-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes about this handover"
                rows={2}
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3">
            <button onClick={handleCreate} disabled={!form.partner_name} className="btn-primary text-sm disabled:opacity-50">
              <Save className="h-4 w-4" /> Create Record
            </button>
          </div>
        </div>
      )}

      {handovers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No handover records yet"
          message="Create a handover record when you dispatch collected e-waste to your recycling partner. This tracks the batch weight, items, and settlement status."
        />
      ) : (
        <div className="space-y-3">
          {handovers.map((h) => (
            <div key={h.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-forest-800">{h.partner_name}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-forest-600">
                    <span className="flex items-center gap-1"><Weight className="h-3.5 w-3.5" /> {h.total_weight_kg} kg</span>
                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {h.total_items} items</span>
                    <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> {h.total_value}</span>
                    <span className="text-forest-400">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  {h.notes && <p className="mt-1 text-xs text-forest-500">{h.notes}</p>}
                </div>
                <select
                  value={h.status}
                  onChange={(e) => handleStatusChange(h.id, e.target.value)}
                  className="rounded-lg border-2 border-forest-200 bg-white px-3 py-2 text-xs font-medium text-forest-700 focus:border-forest-400 focus:outline-none"
                >
                  <option value="dispatched">Dispatched</option>
                  <option value="received">Received</option>
                  <option value="settled">Settled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
