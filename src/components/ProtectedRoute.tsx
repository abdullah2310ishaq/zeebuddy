'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
        <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
