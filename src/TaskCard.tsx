import React from 'react';
import { Task, TaskPriority } from '../types/index.ts';
import { Calendar, Tag } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case 'Urgent':
      return {
        badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
        cardBorder: 'border-l-rose-500',
      };
    case 'High':
      return {
        badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
        cardBorder: 'border-l-amber-500',
      };
    case 'Medium':
      return {
        badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
        cardBorder: 'border-l-blue-400',
      };
    case 'Low':
      return {
        badgeClass: 'text-neutral-600 bg-neutral-100 border-neutral-200',
        cardBorder: 'border-l-neutral-300',
      };
    default:
      return {
        badgeClass: 'text-neutral-600 bg-neutral-100 border-neutral-200',
        cardBorder: 'border-l-neutral-300',
      };
  }
}

export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const formattedDate = formatDueDate(task.due_date);
  const { badgeClass, cardBorder } = getPriorityBadge(task.priority);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className={`bg-white border border-neutral-200/90 hover:border-neutral-400 border-l-[3px] ${cardBorder} p-3 rounded-md cursor-grab active:cursor-grabbing transition-all select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm group`}
    >
      {/* Title */}
      <h4 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Labels preview if available */}
      {task.labels && (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {task.labels.split(',').slice(0, 2).map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium text-neutral-500 bg-neutral-100/90 px-1.5 py-0.2 rounded border border-neutral-200/60 truncate max-w-[120px]"
            >
              {lbl.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Meta Footer: Priority, Assignee, Due Date */}
      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${badgeClass}`}>
            {task.priority}
          </span>
          {task.assigned_name && (
            <span className="flex items-center gap-1 text-neutral-600 truncate max-w-[100px]">
              <span className="w-4 h-4 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[10px] font-semibold text-neutral-700 shrink-0">
                {task.assigned_name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-[11px]">{task.assigned_name}</span>
            </span>
          )}
        </div>

        {formattedDate && (
          <div className="flex items-center gap-1 text-[11px] text-neutral-500 shrink-0 font-mono">
            <Calendar className="w-3 h-3 text-neutral-400" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
