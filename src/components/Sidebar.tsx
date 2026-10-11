import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  User as UserIcon,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  unreadCount = 0,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-neutral-900/40 z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-5 h-5 bg-neutral-900 rounded-sm flex items-center justify-center text-white text-[11px] font-bold tracking-tighter">
              CF
            </div>
            <span className="text-sm font-bold tracking-tight text-neutral-900 uppercase">
              CollabFlow
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left font-medium ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums ${
                      isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footnote & Logout */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/50">
          <div className="flex items-center justify-between px-2 py-1.5 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-900 truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-neutral-500 truncate leading-tight mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-neutral-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-500 hover:text-red-600" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
