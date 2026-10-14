import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui';
import {
  Shield, LayoutDashboard, Truck, ClipboardCheck, IndianRupee,
  Boxes, Users, MapPin, ArrowLeft, ClipboardList, Cpu,
} from 'lucide-react';

const ADMIN_SECTIONS = [
  { label: 'Overview', desc: 'Dashboard stats and recent activity', href: '/admin/overview', icon: LayoutDashboard },
  { label: 'Orders', desc: 'Approve orders, assign companies, award points', href: '/admin/orders', icon: ClipboardList },
  { label: 'Manage Components', desc: 'Add, edit, delete lab components', href: '/admin/components', icon: Cpu },
  { label: 'Component Requests', desc: 'Approve or reject student requests', href: '/admin/component-requests', icon: ClipboardCheck },
  { label: 'Pickup Requests', desc: 'View and manage incoming pickup requests', href: '/admin/pickups', icon: Truck },
  { label: 'Inspection & Grading', desc: 'Grade collected items and confirm values', href: '/admin/grading', icon: ClipboardCheck },
  { label: 'Rate Table', desc: 'Edit pricing for each category and grade', href: '/admin/rates', icon: IndianRupee },
  { label: 'Stock Dashboard', desc: 'Collected e-waste inventory by category', href: '/admin/stock', icon: Boxes },
  { label: 'Company Handover', desc: 'Track batch handovers to recycling partners', href: '/admin/handover', icon: Truck },
  { label: 'Users & Points', desc: 'View user profiles, points, and wallet balances', href: '/admin/users', icon: Users },
  { label: 'Service Zones', desc: 'Manage pickup service areas', href: '/admin/zones', icon: MapPin },
];

export function AdminPage() {
  const { navigate } = useRouter();
  const { profile } = useAuth();

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <PageHeader title="Admin Panel" subtitle={`Manage Reboot Earth — ${profile?.name || 'Admin'}`} icon={Shield} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="card card-hover group flex items-start gap-4 text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg shadow-forest-500/20 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">{item.label}</h3>
                <p className="text-xs text-forest-600">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
