import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Fact, Setting } from '@/lib/supabase';
import { Recycle, Truck, Award, ArrowRight, Leaf, Cpu, Zap, Globe, TrendingDown, Package, AlertTriangle } from 'lucide-react';

export function HomePage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [partnerText, setPartnerText] = useState('Authorised recycling partner: tie-up in progress');
  const [impact, setImpact] = useState({ kg: 1247, items: 389, co2: 4123 });
  const [animatedImpact, setAnimatedImpact] = useState({ kg: 0, items: 0, co2: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: factsData }, { data: settingsData }] = await Promise.all([
        supabase.from('facts').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('settings').select('key, value'),
      ]);
      if (factsData) setFacts(factsData as Fact[]);
      if (settingsData) {
        const settingsMap = (settingsData as Setting[]).reduce((acc, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {} as Record<string, string>);
        setPartnerText(settingsMap['partner_text'] || partnerText);
      }
    })();
  }, []);

  // Rotate facts every 5 seconds
  useEffect(() => {
    if (facts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % facts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [facts.length]);

  // Animate impact counters
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedImpact({
        kg: Math.round(impact.kg * eased),
        items: Math.round(impact.items * eased),
        co2: Math.round(impact.co2 * eased),
      });

      if (currentStep >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [impact]);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-mesh text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-forest-500 blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-emerald-light blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative container-max px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Leaf className="h-4 w-4 text-emerald-light" />
                SDG 11 — Sustainable Cities & Communities
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight text-balance sm:text-5xl lg:text-6xl">
                Reboot your e-waste.
                <br />
                <span className="bg-gradient-to-r from-emerald-light to-mint-dark bg-clip-text text-transparent">
                  Reboot the Earth.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-mint-light/80">
                Turn your old electronics into rewards. Schedule a free pickup, earn wallet cash and points, and get a recycling certificate — all from your phone.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate(user ? '/add-items' : '/signup')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-forest-800 shadow-xl transition-all duration-300 hover:bg-mint-light hover:-translate-y-0.5"
                >
                  <Truck className="h-5 w-5" />
                  Schedule Pickup
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/accept')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
                >
                  <Recycle className="h-5 w-5" />
                  What We Accept
                </button>
              </div>
            </div>

            {/* Animated globe / illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse-glow rounded-full" />
                <div className="relative flex h-80 w-80 items-center justify-center rounded-full bg-gradient-to-br from-forest-500/20 to-emerald-light/20 backdrop-blur-sm">
                  <Globe className="h-48 w-48 text-emerald-light animate-float" />
                </div>
                {/* Floating icons */}
                <div className="absolute -top-4 -left-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md animate-float" style={{ animationDelay: '0.5s' }}>
                  <Cpu className="h-8 w-8 text-mint-dark" />
                </div>
                <div className="absolute top-1/2 -right-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md animate-float" style={{ animationDelay: '1.5s' }}>
                  <Zap className="h-8 w-8 text-amber" />
                </div>
                <div className="absolute -bottom-4 left-1/4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md animate-float" style={{ animationDelay: '2s' }}>
                  <Package className="h-8 w-8 text-emerald-light" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="block w-full" viewBox="0 0 1440 80" preserveAspectRatio="none" fill="#F7FBF8">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* Impact counters */}
      <section className="container-max px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Recycle, label: 'kg collected', value: animatedImpact.kg, color: 'text-forest-500', bg: 'bg-forest-50' },
            { icon: Package, label: 'items recycled', value: animatedImpact.items, color: 'text-emerald-light', bg: 'bg-mint/50' },
            { icon: TrendingDown, label: 'kg CO₂ saved', value: animatedImpact.co2, color: 'text-amber-dark', bg: 'bg-amber-light/20' },
          ].map((stat, i) => (
            <div
              key={i}
              className="card card-hover animate-fade-in-up text-center"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg}`}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              <div className="font-display text-3xl font-bold text-forest-800">
                {stat.value.toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-forest-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-forest-800 sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-forest-600">Three simple steps to recycle your e-waste and earn rewards</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: Package, step: '1', title: 'Add Items', desc: 'Snap a photo or pick from the list. We will check if it is accepted and estimate its value.', color: 'from-forest-500 to-forest-600' },
              { icon: Truck, step: '2', title: 'Book Pickup', desc: 'Choose a date and time slot. Our team collects from your doorstep — or drop at a collection point.', color: 'from-emerald-light to-forest-500' },
              { icon: Award, step: '3', title: 'Get Rewarded', desc: 'Earn wallet cash for high-value items and points for low-value ones. Get a recycling certificate.', color: 'from-amber to-amber-dark' },
            ].map((item, i) => (
              <div
                key={i}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="card card-hover h-full text-center">
                  <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-forest-50 text-sm font-bold text-forest-600">
                    {item.step}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-forest-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-forest-600">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10 h-8 w-8 -translate-y-1/2 items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-forest-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Did you know? banner */}
      {facts.length > 0 && (
        <section className="bg-forest-50 py-6">
          <div className="container-max px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-light/30">
                <Zap className="h-6 w-6 text-amber-dark" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-dark uppercase tracking-wide">Did you know?</p>
                <p key={currentFactIndex} className="text-sm text-forest-800 animate-fade-in mt-1">
                  {facts[currentFactIndex]?.text}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why e-waste is harmful */}
      <section className="container-max px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-hazard">
              <AlertTriangle className="h-4 w-4" />
              The E-Waste Problem
            </div>
            <h2 className="font-display text-3xl font-bold text-forest-800 sm:text-4xl mb-4">
              Why e-waste matters
            </h2>
            <p className="text-forest-600 mb-6">
              Electronic waste is the fastest-growing waste stream in the world. When dumped in landfills, toxic chemicals like lead, mercury, and cadmium leach into soil and water, threatening health and ecosystems.
            </p>
            <ul className="space-y-3">
              {[
                '50 million tonnes of e-waste generated globally each year',
                'Only 17% is formally collected and recycled',
                'Toxic metals contaminate soil, water, and air when burned',
                'Recycling recovers gold, silver, copper, and rare metals',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-forest-50 mt-0.5">
                    <Leaf className="h-4 w-4 text-forest-500" />
                  </div>
                  <span className="text-sm text-forest-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: AlertTriangle, value: '50M', unit: 'tonnes/year', label: 'Global e-waste', color: 'text-hazard', bg: 'bg-red-50' },
              { icon: TrendingDown, value: '17%', unit: 'recycled', label: 'Formal recycling rate', color: 'text-amber-dark', bg: 'bg-amber-light/20' },
              { icon: Cpu, value: '60+', unit: 'elements', label: 'Recoverable metals', color: 'text-forest-500', bg: 'bg-forest-50' },
              { icon: Leaf, value: '3,500', unit: 'homes', label: 'Energy saved per 1M phones', color: 'text-emerald-light', bg: 'bg-mint/50' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`card animate-scale-in text-center ${stat.bg}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <stat.icon className={`mx-auto h-8 w-8 ${stat.color} mb-3`} />
                <div className="font-display text-2xl font-bold text-forest-800">{stat.value}</div>
                <div className="text-xs text-forest-600">{stat.unit}</div>
                <p className="mt-2 text-xs font-medium text-forest-700">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner text */}
      <section className="bg-forest-50 py-8">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm">
            <Recycle className="h-5 w-5 text-forest-500 flex-shrink-0" />
            <p className="text-sm font-medium text-forest-700">{partnerText}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-mesh text-white py-16">
        <div className="container-max px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold sm:text-4xl mb-4">
            Ready to reboot your e-waste?
          </h2>
          <p className="mx-auto max-w-xl text-mint-light/80 mb-8">
            Join our community of eco-warriors. Every item you recycle makes a measurable difference.
          </p>
          <button
            onClick={() => navigate(user ? '/add-items' : '/signup')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-forest-800 shadow-xl transition-all duration-300 hover:bg-mint-light hover:-translate-y-0.5"
          >
            {user ? 'Add Your E-Waste' : 'Get Started — It is Free'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
