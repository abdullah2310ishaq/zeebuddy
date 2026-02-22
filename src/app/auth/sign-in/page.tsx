'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInPage() {
  const { user, loading, signInWithEmailPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await signInWithEmailPassword(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout title="ZeeBuddy Admin" subtitle="Sign in to continue">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome to ZeeBuddy Admin"
      subtitle="Sign in with email to continue."
    >
      <div className="max-w-md m-auto flex flex-col justify-center h-full gap-6">
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 focus:border-red-600 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 focus:border-red-600 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 px-6 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Google auth – commented out for now
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center gap-3 w-full h-12 px-6 bg-white border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-red-600 hover:text-red-600 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
        */}
      </div>
    </AuthLayout>
  );
}
