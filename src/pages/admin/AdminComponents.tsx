import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Component, ComponentStatus } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { Cpu, ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react';

const STATUS_OPTIONS: ComponentStatus[] = ['Available', 'Under Testing', 'Not Available'];

export function AdminComponents() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Component | null>(null);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [status, setStatus] = useState<ComponentStatus>('Available');

  const fetchComponents = async () => {
    const { data, error } = await supabase.from('components').select('*').order('name');
    if (error) {
      showToast('Failed to load components', 'error');
    }
    setComponents((data ?? []) as Component[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setCategory('');
    setQuantity(0);
    setStatus('Available');
    setShowForm(true);
  };

  const openEdit = (c: Component) => {
    setEditing(c);
    setName(c.name);
    setCategory(c.category);
    setQuantity(c.quantity);
    setStatus(c.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'warning');
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from('components')
        .update({ name: name.trim(), category: category.trim() || 'General', quantity, status, updated_at: new Date().toISOString() })
        .eq('id', editing.id);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Component updated', 'success');
    } else {
      const { error } = await supabase
        .from('components')
        .insert({ name: name.trim(), category: category.trim() || 'General', quantity, status, is_demo: false });
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Component added', 'success');
    }
    setShowForm(false);
    fetchComponents();
  };

  const handleDelete = async (c: Component) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from('components').delete().eq('id', c.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Component deleted', 'success');
    fetchComponents();
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

      <PageHeader title="Manage Components" subtitle="Add, edit, and track lab components" icon={Cpu} />

      <button onClick={openAdd} className="btn-primary mb-6">
        <Plus className="h-4 w-4" /> Add Component
      </button>

      {components.length === 0 ? (
        <EmptyState icon={Cpu} title="No components yet" message="Add your first lab component." />
      ) : (
        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-sm font-bold text-forest-800">{c.name}</h3>
                  {c.is_demo && <span className="rounded bg-mint/40 px-1.5 py-0.5 text-[10px] font-semibold text-forest-600">Demo data</span>}
                </div>
                <p className="text-xs text-forest-500 mt-0.5">{c.category} &middot; Qty: {c.quantity} &middot; {c.status}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-forest-500 hover:bg-forest-50">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(c)} className="rounded-lg p-2 text-hazard hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/40 p-4" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-800">{editing ? 'Edit' : 'Add'} Component</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-forest-400 hover:bg-forest-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g. 555 Timer IC" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" placeholder="e.g. IC" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Quantity</label>
              <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ComponentStatus)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={handleSave} className="btn-primary w-full">{editing ? 'Save Changes' : 'Add Component'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
