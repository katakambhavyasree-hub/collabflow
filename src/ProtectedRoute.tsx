import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
  children: ReactNode;
  onNavigateLogin?: () => void;
}

export function ProtectedRoute({ children, onNavigateLogin }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-500">Loading CollabFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (onNavigateLogin) {
      onNavigateLogin();
    }
    return null;
  }

  return <>{children}</>;
}
