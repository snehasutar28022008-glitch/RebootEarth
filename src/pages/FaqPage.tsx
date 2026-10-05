import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Faq } from '@/lib/supabase';
import { PageHeader } from '@/components/ui';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setFaqs((data ?? []) as Faq[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="container-max section-padding">
        <div className="skeleton h-12 w-1/2 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in">
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about recycling your e-waste with Reboot Earth."
        icon={HelpCircle}
      />

      <div className="max-w-3xl space-y-3">
        {faqs.map((faq, i) => (
          <div
            key={faq.id}
            className="card overflow-hidden p-0 animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-forest-50/30"
            >
              <span className="text-sm font-semibold text-forest-800">{faq.question}</span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 text-forest-500 transition-transform duration-300 ${
                  openIndex === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === i ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <p className="px-5 pb-4 text-sm text-forest-600 leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
