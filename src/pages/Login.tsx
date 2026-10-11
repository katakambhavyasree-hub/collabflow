import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginProps {
  onNavigateRegister: () => void;
  onSuccess: () => void;
}

export function Login({ onNavigateRegister, onSuccess }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('bhavya@collabflow.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-neutral-900 rounded-sm flex items-center justify-center text-white text-xs font-bold tracking-tight">
            CF
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-900 uppercase">
            CollabFlow
          </span>
        </div>
        <h2 className="text-center text-xl font-semibold text-neutral-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-neutral-500">
          Real-Time Collaborative Project Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 border border-neutral-200 rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 leading-normal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-md transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-neutral-200">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Quick demo login (password: password123)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('bhavya@collabflow.io')}
                className="p-1.5 text-left text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors"
              >
                <span className="font-semibold block truncate">Bhavya</span>
                <span className="text-[11px] text-neutral-500 block truncate">bhavya@collabflow.io</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('rahul@collabflow.io')}
                className="p-1.5 text-left text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors"
              >
                <span className="font-semibold block truncate">Rahul (Lead)</span>
                <span className="text-[11px] text-neutral-500 block truncate">rahul@collabflow.io</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-neutral-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-semibold text-neutral-900 hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
