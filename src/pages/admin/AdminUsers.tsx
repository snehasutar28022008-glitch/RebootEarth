import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  Users, ArrowLeft, AlertTriangle, Search, Award, Wallet, Shield, Star,
} from 'lucide-react';

export function AdminUsers() {
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (err) {
          setError(err.message);
        } else {
          setUsers((data ?? []) as Profile[]);
        }
      } catch {
        setError('Failed to load users');
      }
      setLoading(false);
    })();
  }, []);

  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error: updateErr } = await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', id);
    if (updateErr) {
      showToast(updateErr.message, 'error');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole as Profile['role'] } : u)));
    showToast(`Role updated to ${newRole}`, 'success');
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-500 hover:text-forest-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
      </button>

      <PageHeader title="Users & Points" subtitle="View user profiles, points, and wallet balances" icon={Users} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-hazard" />
          <p className="text-sm text-hazard">{error}</p>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border-2 border-forest-200 bg-white py-2.5 pl-10 pr-4 text-sm text-forest-800 placeholder-forest-400 focus:border-forest-400 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={users.length === 0 ? "No users yet" : "No matching users"}
          message={users.length === 0 ? "User profiles will appear here once people sign up." : "Try a different search."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <div key={user.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${user.role === 'admin' ? 'bg-forest-500' : 'bg-forest-50'}`}>
                    {user.role === 'admin' ? <Shield className="h-5 w-5 text-white" /> : <Users className="h-5 w-5 text-forest-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-forest-800">{user.name || 'Unnamed'}</p>
                      {user.role === 'admin' && (
                        <span className="rounded-lg bg-forest-500 px-2 py-0.5 text-xs font-semibold text-white">Admin</span>
                      )}
                    </div>
                    <p className="text-xs text-forest-500">{user.email}</p>
                    {user.city && <p className="text-xs text-forest-400">{user.city} {user.pincode}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-light/20 px-3 py-1.5">
                    <Star className="h-4 w-4 text-amber-dark" />
                    <span className="text-sm font-semibold text-amber-dark">{user.points}</span>
                    <span className="text-xs text-amber-dark/70">pts</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-mint/40 px-3 py-1.5">
                    <Wallet className="h-4 w-4 text-emerald-700" />
                    <span className="text-sm font-semibold text-emerald-700">₹{user.wallet_balance}</span>
                  </div>
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    className="rounded-lg border border-forest-200 px-3 py-1.5 text-xs font-medium text-forest-600 hover:bg-forest-50"
                  >
                    {user.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
