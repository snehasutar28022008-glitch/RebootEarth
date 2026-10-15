import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/lib/supabase';

export function useRouteGuard(requiredRole?: Role): {
  loading: boolean;
  authorized: boolean;
} {
  const { loading: authLoading, role, user } = useAuth();
  const { path, navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const isAdminRoute = path.startsWith('/admin');
    const isProtectedRoute = isAdminRoute || path.startsWith('/dashboard') || path.startsWith('/book') || path.startsWith('/add-items') || path.startsWith('/messages') || path.startsWith('/wallet') || path.startsWith('/profile') || path.startsWith('/pickups') || path.startsWith('/components') || path.startsWith('/my-requests') || path.startsWith('/projects') || path.startsWith('/student-hub');

    if (!isProtectedRoute) {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(path));
      setAuthorized(false);
      setLoading(false);
      return;
    }

    if (isAdminRoute && role !== 'admin') {
      navigate('/dashboard');
      setAuthorized(false);
      setLoading(false);
      return;
    }

    if (requiredRole && role !== requiredRole) {
      navigate('/dashboard');
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    setLoading(false);
  }, [authLoading, user, role, path, navigate, requiredRole]);

  return { loading, authorized };
}
