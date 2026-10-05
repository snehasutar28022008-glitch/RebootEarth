import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AcceptedItem, Setting } from '@/lib/supabase';
import { PageHeader } from '@/components/ui';
import { CheckCircle, AlertTriangle, XCircle, ListChecks, Info } from 'lucide-react';

export function AcceptPage() {
  const [items, setItems] = useState<AcceptedItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: itemsData }, { data: settingsData }] = await Promise.all([
        supabase.from('accepted_items').select('*').order('type, sort_order'),
        supabase.from('settings').select('key, value'),
      ]);
      setItems((itemsData ?? []) as AcceptedItem[]);
      if (settingsData) {
        const map = (settingsData as Setting[]).reduce((acc, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {} as Record<string, string>);
        setSettings(map);
      }
      setLoading(false);
    })();
  }, []);

  const accepted = items.filter((i) => i.type === 'accepted');
  const special = items.filter((i) => i.type === 'special');
  const notAccepted = items.filter((i) => i.type === 'not_accepted');

  if (loading) {
    return (
      <div className="container-max section-padding">
        <div className="skeleton h-12 w-1/2 mb-6" />
        <div className="skeleton h-64 w-full mb-4" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in">
      <PageHeader
        title="What We Accept"
        subtitle="We collect a wide range of small electronic waste. The final list depends on our recycling partner's rules."
        icon={ListChecks}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accepted */}
        <div className="card">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
              <CheckCircle className="h-6 w-6 text-forest-500" />
            </div>
            <h2 className="font-display text-xl font-bold text-forest-800">Accepted Items</h2>
          </div>
          <ul className="space-y-2">
            {accepted.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl bg-forest-50/50 px-3 py-2.5 transition-all hover:bg-forest-50">
                <CheckCircle className="h-5 w-5 text-forest-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-forest-700">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {/* Special handling */}
          <div className="card border-2 border-amber-light/40">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-light/30">
                <AlertTriangle className="h-6 w-6 text-amber-dark" />
              </div>
              <h2 className="font-display text-xl font-bold text-forest-800">Special Handling</h2>
            </div>
            <p className="text-xs text-amber-dark mb-3">Accepted only with a hazard flag</p>
            <ul className="space-y-2">
              {special.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-xl bg-amber-light/10 px-3 py-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-dark flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-forest-700">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not accepted */}
          <div className="card border-2 border-red-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <XCircle className="h-6 w-6 text-hazard" />
              </div>
              <h2 className="font-display text-xl font-bold text-forest-800">Not Accepted</h2>
            </div>
            <ul className="space-y-2">
              {notAccepted.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-xl bg-red-50/50 px-3 py-2.5">
                  <XCircle className="h-5 w-5 text-hazard flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-forest-700">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-8 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-forest-50 p-4">
          <Info className="h-5 w-5 text-forest-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-forest-700">{settings['accepted_list_note'] || 'The final list depends on our recycling partner\'s rules.'}</p>
        </div>
        {settings['min_quantity'] && (
          <div className="flex items-start gap-3 rounded-2xl bg-mint/30 p-4">
            <Info className="h-5 w-5 text-forest-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-forest-700">
              Minimum {settings['min_quantity']} items per pickup. You can mix different categories in one pickup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
