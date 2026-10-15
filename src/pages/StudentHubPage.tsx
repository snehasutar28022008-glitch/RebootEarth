import { useRouter } from '@/context/RouterContext';
import { PageHeader } from '@/components/ui';
import { Cpu, Lightbulb, ClipboardList, ArrowRight } from 'lucide-react';

const CARDS = [
  {
    label: 'Components',
    desc: 'Browse available lab components and request what you need',
    href: '/components',
    icon: Cpu,
  },
  {
    label: 'Mini Projects',
    desc: 'Explore project ideas and check component availability',
    href: '/projects',
    icon: Lightbulb,
  },
  {
    label: 'My Requests',
    desc: 'Track the status of your component requests',
    href: '/my-requests',
    icon: ClipboardList,
  },
];

export function StudentHubPage() {
  const { navigate } = useRouter();

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <PageHeader title="Student Hub" subtitle="Find recovered components and explore mini projects" icon={Lightbulb} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={card.href}
              onClick={() => navigate(card.href)}
              className="card card-hover group flex flex-col items-start gap-4 text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg shadow-forest-500/20 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">{card.label}</h3>
                <p className="text-xs text-forest-600">{card.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
