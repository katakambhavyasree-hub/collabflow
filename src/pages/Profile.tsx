import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, Lock, Save, CheckCircle } from 'lucide-react';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'October 2026';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function Profile() {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Edit State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);
      await api.users.updateProfile({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
      await refreshUser();
      setProfileSuccess('Profile details saved successfully.');
    } catch (err: any) {
      setProfileError(err?.message || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      await api.users.updatePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Unable to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          User Profile
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your personal details, email credentials, and security password.
        </p>
      </div>

      {/* Profile Overview & Edit */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-200">
          <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center text-lg font-bold text-neutral-800 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {user?.name || 'User'}
            </h3>
            <p className="text-xs text-neutral-500">{user?.email}</p>
            <p className="text-[11px] text-neutral-400 font-mono mt-1">
              Member since {formatDate(user?.created_at)} · {user?.role || 'Software Engineer'}
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Personal Information
          </h4>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Work Email (Read-only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50 text-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{profileSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Secure Password Change */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-neutral-700" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Change Password
          </h3>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-md transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
