import React, { useState, useEffect } from 'react';
import { Project, Task, Activity, DashboardStats } from '../types/index.ts';
import { api } from '../services/api.ts';
import { FolderKanban, CheckSquare, Clock, ArrowRight, Calendar } from 'lucide-react';

interface DashboardProps {
  onNavigateProjects: () => void;
  onOpenProject: (projectId: number) => void;
  onOpenTask: (task: Task) => void;
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let timeStr = 'Good morning';
  if (hour >= 12 && hour < 17) timeStr = 'Good afternoon';
  else if (hour >= 17) timeStr = 'Good evening';
  return `${timeStr}, ${name}`;
}

function formatTaskDueDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `Due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
  } catch {
    return dateStr;
  }
}

function formatActivityDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export function Dashboard({ onNavigateProjects, onOpenProject, onOpenTask }: DashboardProps) {
  const [userName, setUserName] = useState<string>('Bhavya');
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    myTasks: 0,
    completedTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.dashboard.getOverview();
      setUserName(res.userName || 'Bhavya');
      setStats(res.stats);
      setRecentProjects(res.recentProjects || []);
      setUpcomingTasks(res.upcomingTasks || []);
      setRecentActivities(res.recentActivities || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
        <p className="text-xs text-neutral-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          {getGreeting(userName)}
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Here is a summary of your workspace and upcoming project deadlines.
        </p>
      </div>

      {/* 4 Overview Statistics - Clean Minimal Metric Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-neutral-200 border-t-2 border-t-indigo-500 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all">
            <span className="text-xs text-neutral-500 font-medium block">
              Total Projects
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight mt-1 font-mono tabular-nums block">
              {stats.totalProjects}
            </span>
          </div>

          <div className="p-4 bg-white border border-neutral-200 border-t-2 border-t-emerald-500 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all">
            <span className="text-xs text-neutral-500 font-medium block">
              Active Projects
            </span>
            <span className="text-2xl font-bold text-emerald-950 tracking-tight mt-1 font-mono tabular-nums block">
              {stats.activeProjects}
            </span>
          </div>

          <div className="p-4 bg-white border border-neutral-200 border-t-2 border-t-sky-500 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all">
            <span className="text-xs text-neutral-500 font-medium block">
              My Tasks
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight mt-1 font-mono tabular-nums block">
              {stats.myTasks}
            </span>
          </div>

          <div className="p-4 bg-white border border-neutral-200 border-t-2 border-t-teal-500 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all">
            <span className="text-xs text-neutral-500 font-medium block">
              Completed Tasks
            </span>
            <span className="text-2xl font-bold text-teal-950 tracking-tight mt-1 font-mono tabular-nums block">
              {stats.completedTasks}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Projects & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Recent Projects
            </h3>
            <button
              onClick={onNavigateProjects}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
            {recentProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="p-3.5 hover:bg-neutral-50/70 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0 pr-3">
                  <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950 truncate">
                    {proj.name}
                  </h4>
                  {proj.description && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {proj.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                    <span>{proj.member_count || 1} members</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.task_count || 0} tasks</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-neutral-600 font-medium">{proj.status}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors shrink-0" />
              </div>
            ))}

            {recentProjects.length === 0 && (
              <div className="p-6 text-center text-xs text-neutral-400">
                No projects found.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
            Upcoming Tasks
          </h3>
          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
            {upcomingTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onOpenTask(t)}
                className="p-3.5 hover:bg-neutral-50/70 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0 pr-3">
                  <h4 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950 truncate">
                    {t.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                    <span className="text-[11px] font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
                      {t.priority}
                    </span>
                    {t.due_date && (
                      <span className="text-neutral-600 font-mono text-[11px]">
                        {formatTaskDueDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-mono text-neutral-500 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded shrink-0">
                  {t.status}
                </span>
              </div>
            ))}

            {upcomingTasks.length === 0 && (
              <div className="p-6 text-center text-xs text-neutral-400">
                No upcoming task deadlines scheduled.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Recent Activity
        </h3>
        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="p-3 sm:px-4 sm:py-3 flex items-center justify-between text-xs text-neutral-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[11px] font-semibold text-neutral-700 shrink-0">
                  {act.user_name ? act.user_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-neutral-900">{act.user_name}</span>{' '}
                  <span className="text-neutral-600">{act.action}</span>
                  {act.task_title && (
                    <span className="font-medium text-neutral-900"> "{act.task_title}"</span>
                  )}
                  {act.details && (
                    <span className="text-neutral-400 text-[11px] ml-1.5 hidden sm:inline">
                      - {act.details}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-neutral-400 font-mono shrink-0 ml-2">
                {formatActivityDate(act.created_at)}
              </span>
            </div>
          ))}

          {recentActivities.length === 0 && (
            <div className="p-6 text-center text-xs text-neutral-400">
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
