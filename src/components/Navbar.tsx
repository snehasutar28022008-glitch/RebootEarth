import { useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useBasket } from '@/context/BasketContext';
import { Recycle, Menu, X, LayoutDashboard, LogOut, User, Shield, Home, Phone, Info, HelpCircle, ListChecks, IndianRupee, ShoppingCart } from 'lucide-react';

export function Navbar() {
  const { path, navigate } = useRouter();
  const { user, profile, role, signOut } = useAuth();
  const { totalItems } = useBasket();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'What We Accept', href: '/accept', icon: ListChecks },
    { label: 'Price List', href: '/prices', icon: IndianRupee },
    { label: 'About', href: '/about', icon: Info },
    { label: 'FAQ', href: '/faq', icon: HelpCircle },
    { label: 'Contact', href: '/contact', icon: Phone },
  ];

  const userLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const adminLinks = [
    { label: 'Admin Panel', href: '/admin', icon: Shield },
  ];

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  const handleNav = (href: string) => {
    navigate(href);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-forest-100/50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button onClick={() => handleNav('/')} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-500 to-emerald-light">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-forest-800">
                Reboot<span className="text-forest-500">Earth</span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {publicLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-forest-50 text-forest-700'
                      : 'text-forest-600 hover:bg-forest-50/50 hover:text-forest-700'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <>
                  {role === 'admin' && (
                    <button onClick={() => handleNav('/admin')} className="flex items-center gap-2 rounded-xl bg-forest-800 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-900 transition-all">
                      <Shield className="h-4 w-4" />
                      Admin
                    </button>
                  )}
                  {totalItems > 0 && (
                    <button onClick={() => handleNav('/add-items')} className="relative flex items-center gap-2 rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-forest-700 hover:bg-mint-dark transition-all">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-500 text-xs font-bold text-white">{totalItems}</span>
                    </button>
                  )}
                  <button onClick={() => handleNav('/dashboard')} className="flex items-center gap-2 rounded-xl bg-forest-50 px-4 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-100 transition-all">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-sm font-bold text-forest-700">
                      {profile?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  </div>
                  <button onClick={handleSignOut} className="rounded-xl p-2 text-forest-600 hover:bg-forest-50 hover:text-forest-800 transition-all" title="Sign out">
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleNav('/login')} className="rounded-xl px-4 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50 transition-all">
                    Login
                  </button>
                  <button onClick={() => handleNav('/signup')} className="btn-primary">
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden rounded-xl p-2 text-forest-700 hover:bg-forest-50">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-forest-100 bg-white animate-fade-in">
            <nav className="flex flex-col gap-1 px-4 py-4">
              {publicLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? 'bg-forest-50 text-forest-700'
                      : 'text-forest-600 hover:bg-forest-50/50'
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </button>
              ))}

              {user && (
                <>
                  <div className="my-2 h-px bg-forest-100" />
                  {totalItems > 0 && (
                    <button
                      onClick={() => handleNav('/add-items')}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                        isActive('/add-items') ? 'bg-mint text-forest-700' : 'text-forest-600 hover:bg-forest-50/50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5" />
                        Pickup Basket
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-500 text-xs font-bold text-white">{totalItems}</span>
                    </button>
                  )}
                  {role === 'admin' && adminLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => handleNav(link.href)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                        isActive(link.href) ? 'bg-forest-800 text-white' : 'text-forest-600 hover:bg-forest-50/50'
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </button>
                  ))}
                  {userLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => handleNav(link.href)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                        isActive(link.href) ? 'bg-forest-50 text-forest-700' : 'text-forest-600 hover:bg-forest-50/50'
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </button>
                  ))}
                  <button onClick={handleSignOut} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-hazard hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              )}

              {!user && (
                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={() => handleNav('/login')} className="btn-outline">Login</button>
                  <button onClick={() => handleNav('/signup')} className="btn-primary">Get Started</button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export function BottomTabBar() {
  const { path, navigate } = useRouter();
  const { user, role } = useAuth();

  if (!user) return null;

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(role === 'admin' ? [{ label: 'Admin', href: '/admin', icon: Shield }] : []),
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-forest-100/50">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.href}
            onClick={() => navigate(tab.href)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
              isActive(tab.href) ? 'text-forest-600' : 'text-gray-400'
            }`}
          >
            <tab.icon className={`h-5 w-5 ${isActive(tab.href) ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
