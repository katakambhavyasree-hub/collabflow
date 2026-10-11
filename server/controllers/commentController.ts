import { Response } from 'express';
import { Server } from 'socket.io';
import db from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

let ioInstance: Server | null = null;
export function setCommentSocketIO(io: Server) {
  ioInstance = io;
}

export async function getCommentsByTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const taskId = Number(req.params.id);

  try {
    const [comments] = await db.query(
      'SELECT c.*, u.name as user_name, u.avatar_url as user_avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = ? ORDER BY c.created_at ASC',
      [taskId]
    );

    res.status(200).json({ comments: comments || [] });
  } catch (error) {
    console.error('getCommentsByTask error:', error);
    res.status(500).json({ error: 'Unable to load comments.' });
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const taskId = Number(req.params.id);
  const userId = req.user?.id;
  const userName = req.user?.name || 'A team member';
  const { content } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty.' });
    return;
  }

  try {
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!tasks || tasks.length === 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const task = tasks[0];
    const projectId = task.project_id;

    const [result] = await db.query(
      'INSERT INTO COMMENTS (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, userId, content.trim()]
    );

    const newCommentId = (result as any)?.insertId || Date.now();

    // Log activity
    await logActivity(
      projectId,
      taskId,
      userId,
      'added comment',
      `Commented on "${task.title}"`,
      ioInstance || undefined
    );

    // Notify task assignee or creator if they are not the author
    const targetUserId = task.assigned_to && task.assigned_to !== userId
      ? task.assigned_to
      : task.created_by !== userId ? task.created_by : null;

    if (targetUserId) {
      await createNotification(
        targetUserId,
        'New Comment',
        `${userName} commented on "${task.title}"`,
        'comment',
        `/projects/${projectId}`,
        ioInstance || undefined
      );
    }

    const [comments] = await db.query(
      'SELECT c.*, u.name as user_name, u.avatar_url as user_avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [newCommentId]
    );

    const createdComment = comments[0] || {
      id: newCommentId,
      task_id: taskId,
      user_id: userId,
      user_name: userName,
      user_avatar: null,
      content: content.trim(),
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('comment:added', createdComment);
      ioInstance.to(`project_${projectId}`).emit('comment-added', createdComment);
    }

    res.status(201).json({
      message: 'Comment added successfully.',
      comment: createdComment,
    });
  } catch (error) {
    console.error('addComment error:', error);
    res.status(500).json({ error: 'Unable to add comment.' });
  }
}

export async function updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const commentId = Number(req.params.id);
  const userId = req.user?.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty.' });
    return;
  }

  try {
    const [comments] = await db.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comments || comments.length === 0) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    const comment = comments[0];
    if (comment.user_id !== userId) {
      res.status(403).json({ error: 'You can only edit your own comments.' });
      return;
    }

    await db.query('UPDATE COMMENTS SET content = ? WHERE id = ?', [content.trim(), commentId]);

    const [tasks] = await db.query('SELECT project_id FROM tasks WHERE id = ?', [comment.task_id]);
    const projectId = tasks[0]?.project_id;

    const [updatedComments] = await db.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    const updated = updatedComments[0];

    if (ioInstance && projectId) {
      ioInstance.to(`project_${projectId}`).emit('comment:updated', updated);
      ioInstance.to(`project_${projectId}`).emit('comment-updated', updated);
    }

    res.status(200).json({
      message: 'Comment updated successfully.',
      comment: updated,
    });
  } catch (error) {
    console.error('updateComment error:', error);
    res.status(500).json({ error: 'Unable to update comment.' });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const commentId = Number(req.params.id);
  const userId = req.user?.id;

  try {
    const [comments] = await db.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comments || comments.length === 0) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    const comment = comments[0];
    if (comment.user_id !== userId) {
      res.status(403).json({ error: 'You can only delete your own comments.' });
      return;
    }

    const [tasks] = await db.query('SELECT project_id FROM tasks WHERE id = ?', [comment.task_id]);
    const projectId = tasks[0]?.project_id;

    await db.query('DELETE FROM COMMENTS WHERE id = ?', [commentId]);

    const payload = { commentId, taskId: comment.task_id };
    if (ioInstance && projectId) {
      ioInstance.to(`project_${projectId}`).emit('comment:deleted', payload);
      ioInstance.to(`project_${projectId}`).emit('comment-deleted', payload);
    }

    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ error: 'Unable to delete comment.' });
  }
}
