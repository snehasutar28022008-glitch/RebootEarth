import { useEffect, useState } from 'react';
import { supabase, type Zone } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  MapPin, ArrowLeft, AlertTriangle, Plus, Save, X, Trash2, Power,
} from 'lucide-react';

export function AdminZones() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', city: 'Pune' });

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('zones')
          .select('*')
          .order('city, name');
        if (err) {
          setError(err.message);
        } else {
          setZones((data ?? []) as Zone[]);
        }
      } catch {
        setError('Failed to load zones');
      }
      setLoading(false);
    })();
  }, []);

  const handleAdd = async () => {
    const { data, error: insertErr } = await supabase
      .from('zones')
      .insert({ name: form.name, city: form.city, is_active: true })
      .select()
      .single();
    if (insertErr) {
      showToast(insertErr.message, 'error');
      return;
    }
    setZones((prev) => [...prev, data as Zone].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)));
    setShowForm(false);
    setForm({ name: '', city: 'Pune' });
    showToast('Zone added', 'success');
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error: updateErr } = await supabase.from('zones').update({ is_active: !current }).eq('id', id);
    if (updateErr) {
      showToast(updateErr.message, 'error');
      return;
    }
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, is_active: !current } : z)));
    showToast(`Zone ${!current ? 'activated' : 'deactivated'}`, 'success');
  };

  const handleDelete = async (id: string) => {
    const { error: deleteErr } = await supabase.from('zones').delete().eq('id', id);
    if (deleteErr) {
      showToast(deleteErr.message, 'error');
      return;
    }
    setZones((prev) => prev.filter((z) => z.id !== id));
    showToast('Zone deleted', 'success');
  };

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeCount = zones.filter((z) => z.is_active).length;

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Service Zones" subtitle="Manage pickup service areas" icon={MapPin} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-forest-500">{zones.length} zones ({activeCount} active)</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Zone
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-forest-800">Add New Zone</h3>
            <button onClick={() => setShowForm(false)} className="text-forest-400 hover:text-forest-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-700">Zone Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Hadapsar"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-700">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Pune"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3">
            <button onClick={handleAdd} disabled={!form.name} className="btn-primary text-sm disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Zone
            </button>
          </div>
        </div>
      )}

      {zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No zones configured"
          message="Add service zones to let users know which areas are covered for pickups."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <div key={zone.id} className={`card ${!zone.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${zone.is_active ? 'bg-forest-50' : 'bg-forest-100'}`}>
                    <MapPin className={`h-5 w-5 ${zone.is_active ? 'text-forest-500' : 'text-forest-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-800">{zone.name}</p>
                    <p className="text-xs text-forest-500">{zone.city}</p>
                    <span className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${zone.is_active ? 'bg-forest-50 text-forest-600' : 'bg-forest-100 text-forest-400'}`}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleToggle(zone.id, zone.is_active)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-forest-200 py-1.5 text-xs font-medium text-forest-600 hover:bg-forest-50"
                >
                  <Power className="h-3.5 w-3.5" /> {zone.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-hazard hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
