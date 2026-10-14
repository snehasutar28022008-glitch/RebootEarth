import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Component } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { Cpu, Search, PackagePlus, X } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  'Available': 'bg-forest-50 text-forest-600',
  'Under Testing': 'bg-amber-light/20 text-amber-dark',
  'Not Available': 'bg-red-50 text-hazard',
};

export function ComponentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [requesting, setRequesting] = useState<Component | null>(null);
  const [qty, setQty] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('components').select('*').order('name');
      if (error) {
        showToast('Failed to load components', 'error');
      }
      setComponents((data ?? []) as Component[]);
      setLoading(false);
    })();
  }, [showToast]);

  const filtered = components.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!requesting || !user) return;
    if (qty < 1) {
      showToast('Quantity must be at least 1', 'warning');
      return;
    }
    if (!purpose.trim()) {
      showToast('Please enter a purpose', 'warning');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('component_requests').insert({
      user_id: user.id,
      component_id: requesting.id,
      quantity: qty,
      purpose: purpose.trim(),
      status: 'Pending',
    });
    setSubmitting(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Request submitted!', 'success');
    setRequesting(null);
    setQty(1);
    setPurpose('');
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
      <PageHeader title="Components" subtitle="Browse available lab components and request what you need" icon={Cpu} />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
        <input
          type="text"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border-2 border-forest-200 bg-white py-2.5 pl-10 pr-4 text-sm text-forest-800 placeholder-forest-400 focus:border-forest-400 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Cpu} title="No components available right now." message="Check back later or contact the lab admin." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <div key={c.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold text-forest-800 truncate">{c.name}</h3>
                  <p className="text-xs text-forest-500 mt-0.5">{c.category}</p>
                </div>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${STATUS_STYLES[c.status] || 'bg-forest-50 text-forest-600'}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-forest-700">
                  <span className="font-display font-bold">{c.quantity}</span>
                  <span className="text-xs text-forest-500">in stock</span>
                </div>
                {c.is_demo && (
                  <span className="rounded bg-mint/40 px-1.5 py-0.5 text-[10px] font-semibold text-forest-600">Demo data</span>
                )}
              </div>
              <button
                onClick={() => { setRequesting(c); setQty(1); setPurpose(''); }}
                disabled={c.quantity <= 0 || c.status === 'Not Available'}
                className="btn-primary mt-3 w-full text-sm disabled:opacity-50"
              >
                <PackagePlus className="h-4 w-4" /> Request
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Request modal */}
      {requesting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/40 p-4" onClick={() => setRequesting(null)}>
          <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-800">Request: {requesting.name}</h3>
              <button onClick={() => setRequesting(null)} className="rounded-lg p-1 text-forest-400 hover:bg-forest-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Quantity</label>
              <input
                type="number"
                min={1}
                max={requesting.quantity}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field"
              />
              <p className="mt-1 text-xs text-forest-400">{requesting.quantity} available</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Purpose</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="What do you need this component for?"
                className="input-field resize-none"
              />
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
