import { useState, useEffect } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Recycle, Mail, Lock, User, Phone, MapPin, MapPinned, Navigation, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export function SignupPage() {
  const { navigate } = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locating, setLocating] = useState(false);

  // Redirect if already logged in
  const { user, role } = useAuth();
  useEffect(() => {
    if (user) {
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, role, navigate]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Please enter your full name';
    if (!email.trim()) e.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (!password) e.password = 'Please enter a password';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!phone.trim()) e.phone = 'Please enter your phone number';
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) e.phone = 'Enter a valid 10-digit phone number';
    if (!city.trim()) e.city = 'Please enter your city/area';
    if (!address.trim()) e.address = 'Please enter your full address';
    if (!pincode.trim()) e.pincode = 'Please enter your pincode';
    else if (!/^\d{6}$/.test(pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        showToast('Location captured', 'success');
      },
      () => {
        setLocating(false);
        showToast('Could not get your location. Please check permissions.', 'error');
      }
    );
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp({
      fullName,
      email,
      password,
      phone,
      city,
      address,
      pincode,
      latitude,
      longitude,
    });
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Account created! Welcome to Reboot Earth.', 'success');
      navigate('/dashboard');
    }
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) showToast(error, 'error');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mint/20 to-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-6 text-center">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-emerald-light shadow-lg">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-forest-800">
              Reboot<span className="text-forest-500">Earth</span>
            </span>
          </button>
        </div>

        <div className="card animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-forest-800 mb-1">Create your account</h1>
          <p className="text-sm text-forest-600 mb-6">Join Reboot Earth and start recycling your e-waste.</p>

          {/* Google login */}
          <button
            onClick={handleGoogle}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-forest-700 transition-all hover:border-forest-200 hover:bg-forest-50/30"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">or sign up with email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field pl-11" placeholder="Jane Doe" />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-hazard">{errors.fullName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" placeholder="you@email.com" />
                </div>
                {errors.email && <p className="mt-1 text-xs text-hazard">{errors.email}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 pr-11" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-hazard">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field pl-11" placeholder="••••••••" />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-hazard">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pl-11" placeholder="9876543210" />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-hazard">{errors.phone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">City / Area *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input-field pl-11" placeholder="Hadapsar, Pune" />
                </div>
                {errors.city && <p className="mt-1 text-xs text-hazard">{errors.city}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-forest-700">Full Address *</label>
              <div className="relative">
                <MapPinned className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field pl-11 resize-none" placeholder="Flat/House no, Street, Landmark" />
              </div>
              {errors.address && <p className="mt-1 text-xs text-hazard">{errors.address}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Pincode *</label>
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="input-field" placeholder="411028" maxLength={6} />
                {errors.pincode && <p className="mt-1 text-xs text-hazard">{errors.pincode}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Location (optional)</label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="input-field flex items-center justify-center gap-2 text-sm font-medium text-forest-600 cursor-pointer"
                >
                  {locating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Getting location...</>
                  ) : (
                    <><Navigation className="h-4 w-4" /> Use my current location</>
                  )}
                </button>
                {latitude && longitude && (
                  <p className="mt-1 text-xs text-forest-500">Location captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                )}
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-start gap-3 rounded-2xl bg-forest-50 p-3">
              <ShieldCheck className="h-5 w-5 text-forest-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-forest-600">
                We use your address and phone only to schedule pickups. Your data is never shared with third parties.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-forest-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-semibold text-forest-500 hover:text-forest-600">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
