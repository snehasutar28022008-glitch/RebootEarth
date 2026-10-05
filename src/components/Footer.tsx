import { useRouter } from '@/context/RouterContext';
import { Recycle, Heart, Github, Mail } from 'lucide-react';

export function Footer() {
  const { navigate } = useRouter();

  const links = {
    public: [
      { label: 'Home', href: '/' },
      { label: 'What We Accept', href: '/accept' },
      { label: 'Price List', href: '/prices' },
      { label: 'About', href: '/about' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  };

  return (
    <footer className="bg-forest-800 text-mint-light/80">
      <div className="container-max px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-500">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Reboot<span className="text-forest-500">Earth</span>
              </span>
            </div>
            <p className="text-sm text-mint-light/60 max-w-xs">
              Reboot your e-waste. Reboot the Earth. An e-waste collection platform for sustainable cities.
            </p>
            <div className="flex items-center gap-2 text-xs text-mint-light/50">
              <span className="badge-success">SDG 11</span>
              <span className="badge-info">SDG 12</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2">
              {links.public.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-sm text-mint-light/60 hover:text-mint-light transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-sm text-mint-light/60 hover:text-mint-light transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">Get in Touch</h3>
            <div className="space-y-2 text-sm text-mint-light/60">
              <button onClick={() => navigate('/contact')} className="flex items-center gap-2 hover:text-mint-light transition-colors">
                <Mail className="h-4 w-4" /> Contact us
              </button>
              <p>Partner: tie-up in progress</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-mint-light/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-mint-light/50">
              © 2026 Reboot Earth. Made with <Heart className="inline h-3 w-3 text-hazard" /> for the planet.
            </p>
            <div className="flex items-center gap-4 text-xs text-mint-light/50">
              <span>Pune, India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
