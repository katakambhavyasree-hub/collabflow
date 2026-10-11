import React, { useState, useEffect } from 'react';
import { Task, ProjectMember, Comment } from '../types/index.ts';
import { api } from '../services/api.ts';
import { CommentSection } from './CommentSection.tsx';
import { TaskFormModal } from './TaskFormModal.tsx';
import {
  X,
  Calendar,
  User as UserIcon,
  Tag,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface TaskDetailsModalProps {
  taskId: number | null;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
  members: ProjectMember[];
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not set';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function TaskDetailsModal({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  members,
}: TaskDetailsModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.tasks.getById(taskId);
      setTask(res.task);
    } catch (err: any) {
      setError(err?.message || 'Unable to load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
    }
  }, [taskId]);

  if (!taskId) return null;

  const handleEditSubmit = async (taskData: Partial<Task>) => {
    if (!task) return;
    try {
      const res = await api.tasks.update(task.id, taskData);
      setTask({
        ...task,
        ...res.task,
      });
      setIsEditing(false);
      if (onTaskUpdated) onTaskUpdated(res.task);
    } catch (err: any) {
      alert(err?.message || 'Unable to update task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const confirmed = window.confirm(`Are you sure you want to delete task "${task.title}"?`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.tasks.delete(task.id);
      if (onTaskDeleted) onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Unable to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!task) return;
    const res = await api.comments.add(task.id, content);
    setTask({
      ...task,
      comments: [...(task.comments || []), res.comment],
    });
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    if (!task) return;
    const res = await api.comments.update(commentId, content);
    setTask({
      ...task,
      comments: (task.comments || []).map((c) => (c.id === commentId ? res.comment : c)),
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!task) return;
    await api.comments.delete(commentId);
    setTask({
      ...task,
      comments: (task.comments || []).filter((c) => c.id !== commentId),
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-900/50">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-800">Task Details</span>
              {task?.project_name && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{task.project_name}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {task && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded transition-colors text-xs flex items-center gap-1 px-2.5"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1.5 text-neutral-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-xs flex items-center gap-1 px-2.5"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors ml-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
                <p className="text-xs text-neutral-500">Loading task details...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {error}
              </div>
            ) : task ? (
              <>
                {/* Title */}
                <div>
                  <h2 className="text-xl font-bold text-neutral-950 tracking-tight leading-snug">
                    {task.title}
                  </h2>
                </div>

                {/* Grid Metadata: Status, Priority, Assignee, Due Date */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-lg text-xs">
                  <div>
                    <span className="block text-[11px] text-neutral-500 font-medium mb-1">
                      Status
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {task.status}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-neutral-500 font-medium mb-1">
                      Priority
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {task.priority}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-neutral-500 font-medium mb-1">
                      Assigned To
                    </span>
                    <span className="font-semibold text-neutral-900 truncate block">
                      {task.assigned_name || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-neutral-500 font-medium mb-1">
                      Due Date
                    </span>
                    <span className="font-semibold text-neutral-900 font-mono text-[11px]">
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Description
                  </h3>
                  <div className="text-sm text-neutral-800 bg-white border border-neutral-200/80 rounded-md p-3.5 leading-relaxed whitespace-pre-wrap">
                    {task.description ? task.description : <span className="text-neutral-400 italic">No description provided for this task.</span>}
                  </div>
                </div>

                {/* Labels */}
                {task.labels && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Labels
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
                      {task.labels.split(',').map((l, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-700 text-[11px]"
                        >
                          {l.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Timestamps */}
                <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 font-mono">
                  <span>Created: {formatDate(task.created_at)}</span>
                  <span>·</span>
                  <span>Updated: {formatDate(task.updated_at)}</span>
                  {task.creator_name && (
                    <>
                      <span>·</span>
                      <span>Created by: {task.creator_name}</span>
                    </>
                  )}
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-neutral-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3 flex items-center justify-between">
                    <span>Comments</span>
                    <span className="font-mono text-neutral-400 font-normal">
                      ({task.comments?.length || 0})
                    </span>
                  </h3>
                  <CommentSection
                    taskId={task.id}
                    comments={task.comments || []}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                  />
                </div>

                {/* Task Activity Log */}
                {task.activities && task.activities.length > 0 && (
                  <div className="pt-4 border-t border-neutral-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                      Task Activity
                    </h3>
                    <div className="space-y-2">
                      {task.activities.map((act) => (
                        <div
                          key={act.id}
                          className="text-xs text-neutral-600 flex items-start gap-2 py-1"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-neutral-900">{act.user_name}</span>{' '}
                            <span>{act.details || act.action}</span>
                            <span className="text-neutral-400 font-mono text-[11px] ml-2">
                              {formatDate(act.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && task && (
        <TaskFormModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSubmit={handleEditSubmit}
          initialTask={task}
          members={members}
          title="Edit Task"
        />
      )}
    </>
  );
}
