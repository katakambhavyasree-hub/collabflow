import React, { useState, useEffect } from 'react';
import { NotificationItem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useSocket } from '../context/SocketContext.tsx';
import { Bell, CheckCheck, Clock } from 'lucide-react';

interface NotificationsPageProps {
  onOpenLink?: (link: string) => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function Notifications({ onOpenLink }: NotificationsPageProps) {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.notifications.getAll();
      setNotifications(res.notifications || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time socket listener for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (item: NotificationItem) => {
      setNotifications((prev) => [item, ...prev]);
    };

    socket.on('notification-created', handleNewNotification);
    socket.on('notification:created', handleNewNotification);

    return () => {
      socket.off('notification-created', handleNewNotification);
      socket.off('notification:created', handleNewNotification);
    };
  }, [socket]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Notifications
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time updates regarding task assignments, comments, and project milestones.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors border border-neutral-200"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-neutral-200 rounded-lg space-y-2">
          <Bell className="w-6 h-6 text-neutral-400 mx-auto" />
          <p className="text-sm font-semibold text-neutral-800">You have no new notifications</p>
          <p className="text-xs text-neutral-500">
            We will alert you when you are assigned tasks or mentioned in discussions.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                !n.is_read ? 'bg-neutral-50/80' : 'hover:bg-neutral-50/40'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    !n.is_read ? 'bg-neutral-900' : 'bg-transparent'
                  }`}
                />

                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-neutral-900 leading-snug">
                    {n.title}
                  </h4>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[11px] text-neutral-400 font-mono mt-1 block">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-xs text-neutral-500 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-200/60 shrink-0 transition-colors"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
