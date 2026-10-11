import React, { useState } from 'react';
import { Comment } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Send, Edit2, Trash2, Check, X } from 'lucide-react';

interface CommentSectionProps {
  taskId: number;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onUpdateComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}

function formatCommentDate(dateStr: string): string {
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

export function CommentSection({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      await onUpdateComment(commentId, editContent.trim());
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const isOwn = user?.id === comment.user_id;
          const isEditing = editingId === comment.id;

          return (
            <div
              key={comment.id}
              className="p-3 bg-neutral-50 rounded-md border border-neutral-200/80 text-xs text-neutral-800"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">
                    {comment.user_name}
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>

                {isOwn && !isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
                      title="Edit comment"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-xs p-2 border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 bg-white"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-neutral-900 rounded hover:bg-neutral-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              )}
            </div>
          );
        })}

        {comments.length === 0 && (
          <p className="text-xs text-neutral-400 italic py-2">
            No comments yet. Be the first to share an update.
          </p>
        )}
      </div>

      {/* Add New Comment Box */}
      <form onSubmit={handleSubmit} className="pt-2">
        <div className="flex flex-col gap-2">
          <textarea
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full text-xs p-2.5 bg-white border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
