import { useEffect, useState } from 'react';
import { supabase, type Rate } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  IndianRupee, ArrowLeft, AlertTriangle, Save, RotateCcw, Plus, Trash2,
} from 'lucide-react';

export function AdminRates() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, { rate?: string; unit?: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('rates')
          .select('*')
          .order('category, grade');
        if (err) {
          setError(err.message);
        } else {
          setRates((data ?? []) as Rate[]);
        }
      } catch {
        setError('Failed to load rates');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (id: string) => {
    const edits = editing[id];
    if (!edits) return;
    setSavingId(id);
    const updates: Record<string, string | number> = {};
    if (edits.rate !== undefined) updates.rate = parseFloat(edits.rate);
    if (edits.unit !== undefined) updates.unit = edits.unit;
    updates.last_updated = new Date().toISOString();

    const { error: updateErr } = await supabase.from('rates').update(updates).eq('id', id);
    setSavingId(null);
    if (updateErr) {
      showToast(updateErr.message, 'error');
      return;
    }
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast('Rate updated', 'success');
  };

  const handleDelete = async (id: string) => {
    const { error: deleteErr } = await supabase.from('rates').delete().eq('id', id);
    if (deleteErr) {
      showToast(deleteErr.message, 'error');
      return;
    }
    setRates((prev) => prev.filter((r) => r.id !== id));
    showToast('Rate deleted', 'success');
  };

  const handleAdd = async (category: string, grade: string, rate: string, unit: string) => {
    const { data, error: insertErr } = await supabase
      .from('rates')
      .insert({ category, grade, rate: parseFloat(rate), unit })
      .select()
      .single();
    if (insertErr) {
      showToast(insertErr.message, 'error');
      return;
    }
    setRates((prev) => [...prev, data as Rate].sort((a, b) => a.category.localeCompare(b.category) || a.grade.localeCompare(b.grade)));
    setShowAddForm(false);
    showToast('Rate added', 'success');
  };

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const categories = [...new Set(rates.map((r) => r.category))];

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Rate Table" subtitle="Edit pricing for each e-waste category and grade" icon={IndianRupee} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-forest-500">{rates.length} rates across {categories.length} categories</p>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Rate
        </button>
      </div>

      {showAddForm && <AddRateForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />}

      {rates.length === 0 ? (
        <EmptyState
          icon={IndianRupee}
          title="No rates configured"
          message="Add rates for each e-waste category and grade to enable value estimation."
        />
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryRates = rates.filter((r) => r.category === category);
            return (
              <div key={category} className="card">
                <h3 className="mb-3 font-display text-sm font-bold text-forest-800">{category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-forest-100 text-left text-xs text-forest-500">
                        <th className="pb-2 pr-3 font-medium">Grade</th>
                        <th className="pb-2 pr-3 font-medium">Rate (₹)</th>
                        <th className="pb-2 pr-3 font-medium">Unit</th>
                        <th className="pb-2 pr-3 font-medium">Updated</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRates.map((rate) => {
                        const edits = editing[rate.id] || {};
                        const isEdited = Object.keys(edits).length > 0;
                        return (
                          <tr key={rate.id} className="border-b border-forest-50 last:border-0">
                            <td className="py-2.5 pr-3">
                              <span className="rounded-lg bg-forest-50 px-2 py-0.5 text-xs font-semibold text-forest-700">{rate.grade}</span>
                            </td>
                            <td className="py-2.5 pr-3">
                              <input
                                type="number"
                                defaultValue={rate.rate}
                                onChange={(e) => setEditing((prev) => ({ ...prev, [rate.id]: { ...prev[rate.id], rate: e.target.value } }))}
                                className="w-24 rounded-lg border border-forest-200 px-2 py-1 text-xs focus:border-forest-400 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 pr-3">
                              <select
                                defaultValue={rate.unit}
                                onChange={(e) => setEditing((prev) => ({ ...prev, [rate.id]: { ...prev[rate.id], unit: e.target.value } }))}
                                className="rounded-lg border border-forest-200 px-2 py-1 text-xs focus:border-forest-400 focus:outline-none"
                              >
                                <option value="per_kg">per kg</option>
                                <option value="per_item">per item</option>
                              </select>
                            </td>
                            <td className="py-2.5 pr-3 text-xs text-forest-400">{new Date(rate.last_updated).toLocaleDateString()}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSave(rate.id)}
                                  disabled={!isEdited || savingId === rate.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest-500 text-white hover:bg-forest-600 disabled:opacity-30"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(rate.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-hazard hover:bg-red-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddRateForm({ onAdd, onCancel }: { onAdd: (cat: string, grade: string, rate: string, unit: string) => void; onCancel: () => void }) {
  const [category, setCategory] = useState('');
  const [grade, setGrade] = useState('A');
  const [rate, setRate] = useState('');
  const [unit, setUnit] = useState('per_kg');

  return (
    <div className="card mb-4 animate-fade-in">
      <h3 className="mb-3 font-display text-sm font-bold text-forest-800">Add New Rate</h3>
      <div className="grid gap-3 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
        <input
          type="number"
          placeholder="Rate (₹)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
        >
          <option value="per_kg">per kg</option>
          <option value="per_item">per item</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onAdd(category, grade, rate, unit)}
          disabled={!category || !rate}
          className="btn-primary text-sm disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save
        </button>
        <button onClick={onCancel} className="btn-outline text-sm">
          <RotateCcw className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );
}
