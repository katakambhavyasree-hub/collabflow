import React from 'react';
import { Task, TaskStatus } from '../types/index.ts';
import { KanbanColumn } from './KanbanColumn.tsx';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: number, newStatus: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'Backlog', title: 'Backlog' },
  { status: 'To Do', title: 'To Do' },
  { status: 'In Progress', title: 'In Progress' },
  { status: 'Review', title: 'Review' },
  { status: 'Completed', title: 'Completed' },
];

export function KanbanBoard({
  tasks,
  onTaskClick,
  onAddTask,
  onMoveTask,
}: KanbanBoardProps) {
  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-max items-start">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              onDropTask={onMoveTask}
            />
          );
        })}
      </div>
    </div>
  );
}
