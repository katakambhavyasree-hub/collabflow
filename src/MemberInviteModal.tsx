import React, { useState, useEffect } from 'react';
import { User, MemberRole } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, UserPlus, Plus } from 'lucide-react';

interface MemberInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { user_id?: number; email?: string; role: MemberRole }) => Promise<void>;
  existingUserIds: number[];
}

export function MemberInviteModal({
  isOpen,
  onClose,
  onInvite,
  existingUserIds,
}: MemberInviteModalProps) {
  const [mode, setMode] = useState<'existing' | 'create'>('existing');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Existing user selection
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [role, setRole] = useState<MemberRole>('Member');

  // Create new user fields
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompanyRole, setNewCompanyRole] = useState('Software Engineer');
  const [newPassword, setNewPassword] = useState('password123');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.users
        .getAll()
        .then((res) => {
          setAllUsers(res.users || []);
        })
        .catch((err) => {
          console.error(err);
        });
      setSelectedUserId('');
      setEmailInput('');
      setRole('Member');
      setNewName('');
      setNewEmail('');
      setNewCompanyRole('Software Engineer');
      setNewPassword('password123');
      setMode('existing');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const availableUsers = allUsers.filter((u) => !existingUserIds.includes(u.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      if (mode === 'create') {
        if (!newName.trim() || !newEmail.trim()) {
          setError('Name and email are required to create a user.');
          return;
        }

        // 1. Create the user
        const createRes = await api.users.create({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newCompanyRole.trim() || 'Software Engineer',
          password: newPassword.trim() || 'password123',
        });

        // 2. Add them to project
        await onInvite({
          user_id: createRes.user.id,
          role,
        });

        onClose();
      } else {
        if (!selectedUserId && !emailInput.trim()) {
          setError('Please select an existing user or enter an email address.');
          return;
        }

        await onInvite({
          user_id: selectedUserId ? Number(selectedUserId) : undefined,
          email: !selectedUserId ? emailInput.trim() : undefined,
          role,
        });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-semibold text-neutral-900">
              {mode === 'create' ? 'Create & Add User' : 'Add Team Member'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Existing vs New */}
        <div className="px-5 pt-3 flex items-center gap-1 border-b border-neutral-200 text-xs">
          <button
            type="button"
            onClick={() => { setMode('existing'); setError(null); }}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              mode === 'existing'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Add Existing User
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setError(null); }}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1 ${
              mode === 'create'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>Create New User</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          {mode === 'existing' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    if (e.target.value) setEmailInput('');
                  }}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                >
                  <option value="">-- Choose from existing team --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px bg-neutral-200 flex-1" />
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider">or by email</span>
                <div className="h-px bg-neutral-200 flex-1" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  disabled={!!selectedUserId}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. teammate@collabflow.io"
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sumanth Reddy"
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. sumanth@collabflow.io"
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Company Role
                  </label>
                  <input
                    type="text"
                    value={newCompanyRole}
                    onChange={(e) => setNewCompanyRole(e.target.value)}
                    placeholder="e.g. QA Engineer"
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Project Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
            >
              <option value="Member">Member (View & work on assigned tasks)</option>
              <option value="Admin">Admin (Manage members & project tasks)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-md transition-colors"
            >
              {isSubmitting ? 'Processing...' : mode === 'create' ? 'Create & Add User' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
