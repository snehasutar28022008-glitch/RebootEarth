import { PageHeader } from '@/components/ui';
import { Leaf, Target, Users, Globe, Heart, Recycle, Award, Truck } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="container-max section-padding animate-fade-in">
      <PageHeader
        title="About Reboot Earth"
        subtitle="We are on a mission to make e-waste recycling accessible, rewarding, and transparent for everyone."
        icon={Leaf}
      />

      {/* Mission */}
      <div className="grid gap-8 lg:grid-cols-2 mb-12">
        <div className="card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50">
            <Target className="h-6 w-6 text-forest-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-forest-800 mb-3">Our Mission</h2>
          <p className="text-forest-600">
            Reboot Earth is an e-waste collection platform that makes recycling electronics as easy as ordering food. We collect your old devices from your doorstep, hand them to authorised recyclers, and reward you for doing the right thing.
          </p>
          <p className="text-forest-600 mt-3">
            Every phone, charger, or cable you recycle prevents toxic chemicals from entering our soil and water — and recovers precious metals that would otherwise be lost.
          </p>
        </div>

        <div className="card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-mint/40">
            <Globe className="h-6 w-6 text-forest-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-forest-800 mb-3">SDG Alignment</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="badge-success flex-shrink-0">SDG 11</span>
              <p className="text-sm text-forest-600">Sustainable Cities & Communities — reducing urban e-waste through doorstep collection and awareness.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="badge-info flex-shrink-0">SDG 12</span>
              <p className="text-sm text-forest-600">Responsible Consumption & Production — ensuring electronics are recycled, not dumped.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-12">
        <h2 className="font-display text-2xl font-bold text-forest-800 mb-6 text-center">What We Stand For</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Recycle, title: 'Sustainability', desc: 'Every item recycled is one less in a landfill.' },
            { icon: Award, title: 'Rewards', desc: 'Get paid for doing good — wallet cash and points.' },
            { icon: Truck, title: 'Convenience', desc: 'Doorstep pickup. No need to go anywhere.' },
            { icon: Heart, title: 'Transparency', desc: 'Track your pickup and get a recycling certificate.' },
          ].map((value, i) => (
            <div key={i} className="card card-hover text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50">
                <value.icon className="h-7 w-7 text-forest-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-forest-800 mb-2">{value.title}</h3>
              <p className="text-sm text-forest-600">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works summary */}
      <div className="card bg-gradient-to-br from-forest-50 to-mint/30">
        <h2 className="font-display text-2xl font-bold text-forest-800 mb-6">The Reboot Earth Flow</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'You add items', desc: 'Tell us what e-waste you have. Photos help but are optional.' },
            { step: '2', title: 'We collect', desc: 'Our team picks it up at your chosen time, or you drop at a collection point.' },
            { step: '3', title: 'It gets recycled', desc: 'Items go to our authorised recycling partner. You get rewards + certificate.' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500 text-white font-bold">
                {item.step}
              </div>
              <h3 className="font-display text-sm font-semibold text-forest-800">{item.title}</h3>
              <p className="text-xs text-forest-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team note */}
      <div className="mt-12 text-center">
        <Users className="mx-auto h-10 w-10 text-forest-300 mb-4" />
        <p className="text-sm text-forest-600 max-w-2xl mx-auto">
          Reboot Earth is a student-led initiative built for the SDG competition. We believe small actions, multiplied across a community, can create a cleaner, greener planet.
        </p>
      </div>
    </div>
  );
}
