import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types/index.ts';
import { api } from '../services/api.ts';
import { TaskDetailsModal } from '../components/TaskDetailsModal.tsx';
import { Calendar, Filter, CheckCircle2 } from 'lucide-react';

interface MyTasksProps {
  onOpenTaskDetails: (task: Task) => void;
}

function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'In Progress':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Review':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'To Do':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'Backlog':
    default:
      return 'bg-neutral-50 text-neutral-700 border-neutral-200';
  }
}

function getPriorityBorder(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return 'border-l-rose-500';
    case 'High':
      return 'border-l-amber-500';
    case 'Medium':
      return 'border-l-blue-400';
    case 'Low':
    default:
      return 'border-l-neutral-300';
  }
}

export function MyTasks({ onOpenTaskDetails }: MyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.tasks.getMyTasks();
      setTasks(res.tasks || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          My Tasks
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Tasks assigned directly to your account across all active projects.
        </p>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-lg text-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {['All', 'To Do', 'In Progress', 'Review', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Priority Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-500">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1 border border-neutral-300 rounded bg-white text-neutral-800 focus:outline-none focus:border-neutral-900"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500">Loading your tasks...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-neutral-200 rounded-lg space-y-2">
          <CheckCircle2 className="w-6 h-6 text-neutral-400 mx-auto" />
          <p className="text-sm font-semibold text-neutral-800">No tasks found</p>
          <p className="text-xs text-neutral-500">
            {tasks.length === 0
              ? 'No tasks assigned to you yet.'
              : 'No tasks match the active filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTaskId(t.id)}
              className={`p-4 hover:bg-neutral-50/80 border-l-[3px] ${getPriorityBorder(
                t.priority
              )} transition-colors cursor-pointer flex items-center justify-between group`}
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950 truncate">
                    {t.title}
                  </h3>
                  {t.project_name && (
                    <span className="text-[11px] text-neutral-400 truncate hidden sm:inline">
                      ({t.project_name})
                    </span>
                  )}
                </div>

                {t.description && (
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {t.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
                  <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
                    {t.priority}
                  </span>
                  {t.due_date && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-500">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      <span>{t.due_date}</span>
                    </span>
                  )}
                  {t.comments_count !== undefined && t.comments_count > 0 && (
                    <span className="text-[11px] font-mono">
                      {t.comments_count} {t.comments_count === 1 ? 'comment' : 'comments'}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border shrink-0 ${getStatusBadgeStyle(
                  t.status
                )}`}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
          }}
          onTaskDeleted={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
            setSelectedTaskId(null);
          }}
          members={[]}
        />
      )}
    </div>
  );
}
