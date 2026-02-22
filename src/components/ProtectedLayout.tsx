'use client';

import { ProtectedRoute } from './ProtectedRoute';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
