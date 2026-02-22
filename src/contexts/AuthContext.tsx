'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { apiFetch, setAdminToken, clearAdminToken } from '@/lib/api-client';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  authType?: 'google' | 'email';
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = async (): Promise<string | null> => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    try {
      const token = await currentUser.getIdToken(true);
      setAdminToken(token);
      return token;
    } catch {
      return null;
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      const res = await apiFetch<{ user: AdminUser; token: string }>('/auth/admin/sign-in', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.success && res.data?.user && res.data?.token) {
        setAdminToken(res.data.token);
        setUser(res.data.user);
        window.location.href = '/dashboard';
      } else {
        clearAdminToken();
        alert(res.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Email sign-in error:', err);
      clearAdminToken();
      alert(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      alert('Firebase not configured. Check your env variables.');
      return;
    }
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      setAdminToken(idToken);

      const res = await apiFetch<{ user: AdminUser }>('/auth/admin/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        window.location.href = '/dashboard';
      } else {
        clearAdminToken();
        alert(res.error || 'Sign in failed');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      clearAdminToken();
      alert(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const signOut = () => {
    const auth = getFirebaseAuth();
    if (auth) firebaseSignOut(auth);
    clearAdminToken();
    setUser(null);
    window.location.href = '/auth/sign-in';
  };

  useEffect(() => {
    const verifySession = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        try {
          const freshToken = await auth.currentUser.getIdToken(true);
          setAdminToken(freshToken);
        } catch {
          /* use stored token (JWT or cached Firebase) */
        }
      }
      const res = await apiFetch<AdminUser>('/auth/admin/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        clearAdminToken();
      }
      setLoading(false);
    };
    verifySession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmailPassword, signOut, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
