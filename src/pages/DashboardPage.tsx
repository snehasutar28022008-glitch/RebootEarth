import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useBasket } from '@/context/BasketContext';
import { PageHeader, EmptyState } from '@/components/ui';
import { Recycle, Truck, Wallet, Award, Package, ArrowRight, Sparkles, Plus, ShoppingCart } from 'lucide-react';

export function DashboardPage() {
  const { navigate } = useRouter();
  const { profile, role } = useAuth();
  const { items, totalItems, totalValueMin, totalValueMax } = useBasket();

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <PageHeader title={`Welcome, ${profile?.name?.split(' ')[0] || 'Recycler'}!`} subtitle="Your e-waste recycling dashboard" icon={Sparkles} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { icon: Recycle, label: 'kg recycled', value: '0', color: 'text-forest-500', bg: 'bg-forest-50' },
          { icon: Package, label: 'items', value: '0', color: 'text-emerald-light', bg: 'bg-mint/40' },
          { icon: Wallet, label: 'wallet', value: `₹${profile?.wallet_balance?.toFixed(0) || '0'}`, color: 'text-amber-dark', bg: 'bg-amber-light/20' },
          { icon: Award, label: 'points', value: `${profile?.points || 0}`, color: 'text-forest-600', bg: 'bg-forest-100' },
        ].map((stat, i) => (
          <div key={i} className="card animate-fade-in-up text-center" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="font-display text-xl font-bold text-forest-800">{stat.value}</div>
            <p className="text-xs text-forest-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <button
          onClick={() => navigate('/add-items')}
          className="card card-hover group flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-forest-800">Add E-Waste Items</h3>
            <p className="text-xs text-forest-600">Add items to your pickup basket</p>
          </div>
          <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/book')}
          className="card card-hover group flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-light to-forest-500 shadow-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-forest-800">Schedule Pickup</h3>
            <p className="text-xs text-forest-600">Book a new e-waste collection</p>
          </div>
          <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/wallet')}
          className="card card-hover group flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-semibold text-forest-800">Wallet & Rewards</h3>
            <p className="text-xs text-forest-600">View balance and history</p>
          </div>
          <ArrowRight className="h-5 w-5 text-forest-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Current basket summary */}
      {items.length > 0 && (
        <div className="card mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
                <ShoppingCart className="h-5 w-5 text-forest-500" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-forest-800">Your Pickup Basket</h3>
                <p className="text-xs text-forest-600">{totalItems} item{totalItems !== 1 ? 's' : ''} • Est. ₹{totalValueMin}–₹{totalValueMax}</p>
              </div>
            </div>
            <button onClick={() => navigate('/add-items')} className="btn-secondary text-xs">
              Manage basket
            </button>
          </div>
        </div>
      )}

      {/* Placeholder content */}
      <EmptyState
        icon={Recycle}
        title="More features coming soon!"
        message="Pickup tracking, certificates, impact dashboard, and more will be added in the next steps."
        action={
          <button onClick={() => navigate('/add-items')} className="btn-primary">
            <Plus className="h-4 w-4" /> Add E-Waste Items
          </button>
        }
      />

      {role === 'admin' && (
        <div className="mt-6 rounded-2xl bg-forest-800 p-6 text-white">
          <h3 className="font-display text-lg font-semibold mb-2">Admin Access</h3>
          <p className="text-sm text-mint-light/80 mb-4">
            You have admin privileges. Visit the admin panel to manage pickups, rates, and more.
          </p>
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-forest-800 hover:bg-mint-light transition-all">
            Go to Admin Panel
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
