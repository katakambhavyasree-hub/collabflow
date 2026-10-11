import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface RegisterProps {
  onNavigateLogin: () => void;
  onSuccess: () => void;
}

export function Register({ onNavigateLogin, onSuccess }: RegisterProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    try {
      setLoading(true);
      setError(null);
      await register(name, email, password, role);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
          Create an account
        </h2>
        <p className="mt-1 text-center text-xs text-neutral-500">
          Collaborate seamlessly across your engineering teams
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
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="e.g. Bhavya"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Work Email
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                placeholder="e.g. Frontend Developer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-md transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-neutral-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-semibold text-neutral-900 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
