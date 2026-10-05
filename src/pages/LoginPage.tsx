import { useState, useEffect } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { Recycle, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const { navigate } = useRouter();
  const { signIn, signInWithGoogle, user, role } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, role, navigate]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      showToast(error, 'error');
    } else {
      showToast('Welcome back!', 'success');
    }
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      showToast(error, 'error');
    }
  };

  const handleReset = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setResetSent(true);
      showToast('Reset link sent to your email', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mint/20 to-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
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
          {!resetMode ? (
            <>
              <h1 className="font-display text-2xl font-bold text-forest-800 mb-1">Welcome back</h1>
              <p className="text-sm text-forest-600 mb-6">Login to manage your e-waste pickups.</p>

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
                <span className="text-xs text-gray-400">or login with email</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-forest-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" placeholder="you@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-forest-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 pr-11" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-hazard">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="button" onClick={() => setResetMode(true)} className="text-xs font-medium text-forest-500 hover:text-forest-600">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Logging in...</>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-forest-600">
                New to Reboot Earth?{' '}
                <button onClick={() => navigate('/signup')} className="font-semibold text-forest-500 hover:text-forest-600">
                  Create an account
                </button>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setResetMode(false); setResetSent(false); }} className="mb-4 flex items-center gap-2 text-sm text-forest-500 hover:text-forest-600">
                <ArrowLeft className="h-4 w-4" /> Back to login
              </button>
              <h1 className="font-display text-2xl font-bold text-forest-800 mb-1">Reset password</h1>
              <p className="text-sm text-forest-600 mb-6">Enter your email and we will send you a reset link.</p>

              {resetSent ? (
                <div className="rounded-2xl bg-forest-50 p-6 text-center">
                  <p className="text-sm text-forest-700">Reset link sent! Check your email inbox.</p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-forest-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="input-field pl-11" placeholder="you@email.com" required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
