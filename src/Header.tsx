import React from 'react';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
  onNavigateTab: (tab: string) => void;
  unreadCount?: number;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({
  title,
  subtitle,
  onOpenMobileSidebar,
  onOpenSearch,
  onNavigateTab,
  unreadCount = 0,
  primaryAction,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 -ml-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-neutral-900 truncate tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-neutral-500 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/70 hover:text-neutral-800 rounded-md border border-neutral-200 transition-colors"
          title="Search projects and tasks (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-1 text-[10px] font-mono bg-white border border-neutral-200 rounded text-neutral-500">
            /
          </kbd>
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={() => onNavigateTab('notifications')}
          className="relative p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-neutral-900 rounded-full" />
          )}
        </button>

        {/* Primary Action Button if provided */}
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{primaryAction.label}</span>
          </button>
        )}

        {/* User Avatar clickable to profile */}
        <button
          onClick={() => onNavigateTab('profile')}
          className="w-7 h-7 rounded-full bg-neutral-100 hover:ring-2 hover:ring-neutral-300 border border-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-semibold shrink-0 transition-all ml-1"
          title={`Profile: ${user?.name}`}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </button>
      </div>
    </header>
  );
}
