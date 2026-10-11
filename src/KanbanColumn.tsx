import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/index.ts';
import { TaskCard } from './TaskCard.tsx';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onDropTask: (taskId: number, newStatus: TaskStatus) => void;
}

function getColumnStyles(status: TaskStatus) {
  switch (status) {
    case 'Backlog':
      return {
        topBorder: 'border-t-2 border-t-neutral-400',
        bg: 'bg-neutral-50/80',
        badge: 'bg-neutral-200/80 text-neutral-700',
      };
    case 'To Do':
      return {
        topBorder: 'border-t-2 border-t-sky-500',
        bg: 'bg-slate-50/70',
        badge: 'bg-sky-100 text-sky-800 border border-sky-200/60',
      };
    case 'In Progress':
      return {
        topBorder: 'border-t-2 border-t-amber-500',
        bg: 'bg-amber-50/25',
        badge: 'bg-amber-100 text-amber-800 border border-amber-200/60',
      };
    case 'Review':
      return {
        topBorder: 'border-t-2 border-t-purple-500',
        bg: 'bg-purple-50/25',
        badge: 'bg-purple-100 text-purple-800 border border-purple-200/60',
      };
    case 'Completed':
      return {
        topBorder: 'border-t-2 border-t-emerald-500',
        bg: 'bg-emerald-50/25',
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200/60',
      };
    default:
      return {
        topBorder: 'border-t-2 border-t-neutral-400',
        bg: 'bg-neutral-50/80',
        badge: 'bg-neutral-200 text-neutral-700',
      };
  }
}

export function KanbanColumn({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  onDropTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const styles = getColumnStyles(status);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr);
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`w-72 sm:w-80 flex flex-col shrink-0 ${styles.bg} ${styles.topBorder} rounded-lg border border-neutral-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all ${
        isDragOver ? 'border-neutral-500 ring-2 ring-neutral-300' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-neutral-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            {title}
          </h3>
          <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${styles.badge}`}>
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(status)}
          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors"
          title={`Add task to ${title}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task List */}
      <div className="p-2 space-y-2.5 flex-1 min-h-[350px] overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDragStart={handleDragStart}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-28 border border-dashed border-neutral-200/90 rounded-md flex items-center justify-center p-3 text-center bg-white/40">
            <span className="text-xs text-neutral-400">
              No tasks in {title}
            </span>
          </div>
        )}
      </div>

      {/* Quick Add Button at Bottom */}
      <div className="p-2 pt-0">
        <button
          onClick={() => onAddTask(status)}
          className="w-full py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>New task</span>
        </button>
      </div>
    </div>
  );
}
