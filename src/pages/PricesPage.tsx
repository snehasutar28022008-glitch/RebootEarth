import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Rate, GradeFactor, Setting } from '@/lib/supabase';
import { PageHeader } from '@/components/ui';
import { IndianRupee, Info, Clock, Tag, TrendingUp } from 'lucide-react';

export function PricesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [gradeFactors, setGradeFactors] = useState<GradeFactor[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ratesData }, { data: gradesData }, { data: settingsData }] = await Promise.all([
        supabase.from('rates').select('*').order('category, grade'),
        supabase.from('grade_factors').select('*').order('grade'),
        supabase.from('settings').select('key, value'),
      ]);
      setRates((ratesData ?? []) as Rate[]);
      setGradeFactors((gradesData ?? []) as GradeFactor[]);
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

  // Group rates by category
  const categories = rates.reduce((acc, rate) => {
    if (!acc[rate.category]) acc[rate.category] = [];
    acc[rate.category].push(rate);
    return acc;
  }, {} as Record<string, Rate[]>);

  const gradeColors: Record<string, string> = {
    A: 'bg-forest-50 text-forest-700',
    B: 'bg-mint/40 text-forest-700',
    C: 'bg-amber-light/20 text-amber-dark',
    Hazardous: 'bg-red-50 text-hazard',
  };

  if (loading) {
    return (
      <div className="container-max section-padding">
        <div className="skeleton h-12 w-1/2 mb-6" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in">
      <PageHeader
        title="Price List"
        subtitle="Estimated rates per kg or per item. Final value depends on weight, grade, and current rates confirmed at collection."
        icon={IndianRupee}
      />

      {/* Sample rates banner */}
      {settings['sample_rates_banner'] && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-light/20 p-4">
          <Info className="h-5 w-5 text-amber-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-dark">{settings['sample_rates_banner']}</p>
        </div>
      )}

      {/* Grade factors */}
      <div className="mb-8 card">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
            <Tag className="h-6 w-6 text-forest-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-forest-800">Grade Factors</h2>
        </div>
        <p className="text-sm text-forest-600 mb-4">
          Final value = weight × category rate × grade factor
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gradeFactors.map((g) => (
            <div key={g.id} className={`rounded-2xl p-4 text-center ${gradeColors[g.grade] || 'bg-gray-50'}`}>
              <div className="font-display text-2xl font-bold">{g.grade}</div>
              <div className="text-xs mt-1 font-medium">{g.label}</div>
              <div className="mt-2 text-lg font-bold">×{g.factor.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rates table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-forest-100 bg-forest-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide sm:px-6">Category</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-forest-600 uppercase tracking-wide">Grade</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-forest-600 uppercase tracking-wide sm:px-6">Rate</th>
                <th className="hidden sm:table-cell px-3 py-3 text-center text-xs font-semibold text-forest-600 uppercase tracking-wide sm:px-6">Unit</th>
                <th className="hidden sm:table-cell px-3 py-3 text-right text-xs font-semibold text-forest-600 uppercase tracking-wide sm:px-6">Updated</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).map(([category, catRates]) => (
                catRates.map((rate, idx) => (
                  <tr
                    key={rate.id}
                    className={`border-b border-forest-50 transition-colors hover:bg-forest-50/30 ${idx === 0 ? 'border-t-2 border-forest-100' : ''}`}
                  >
                    {idx === 0 ? (
                      <td className="px-4 py-3 sm:px-6" rowSpan={catRates.length}>
                        <span className="text-sm font-semibold text-forest-800">{category}</span>
                      </td>
                    ) : null}
                    <td className="px-3 py-3 text-center">
                      <span className={`badge ${gradeColors[rate.grade] || 'bg-gray-100 text-gray-600'}`}>
                        {rate.grade}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right sm:px-6">
                      <span className="text-sm font-bold text-forest-800">
                        ₹{rate.rate.toFixed(2)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-center sm:px-6">
                      <span className="text-xs text-forest-600">
                        {rate.unit === 'per_kg' ? 'per kg' : 'per item'}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-right sm:px-6">
                      <span className="text-xs text-forest-500 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(rate.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Value rule explanation */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-forest-500 mb-3" />
          <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">High-Value Items</h3>
          <p className="text-xs text-forest-600">Phones, laptops, working power banks → earn wallet cash</p>
        </div>
        <div className="card text-center">
          <Tag className="mx-auto h-8 w-8 text-emerald-light mb-3" />
          <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">Low-Value Items</h3>
          <p className="text-xs text-forest-600">Chargers, cables, earphones → earn reward points</p>
        </div>
        <div className="card text-center">
          <Info className="mx-auto h-8 w-8 text-amber-dark mb-3" />
          <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">Final Value</h3>
          <p className="text-xs text-forest-600">Set by admin at collection based on actual weight and grade</p>
        </div>
      </div>
    </div>
  );
}
