import { Response } from 'express';
import { Server } from 'socket.io';
import db from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

let ioInstance: Server | null = null;
export function setTaskSocketIO(io: Server) {
  ioInstance = io;
}

export async function getTasksByProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);

  try {
    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC, id ASC',
      [projectId]
    );

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('getTasksByProject error:', error);
    res.status(500).json({ error: 'Unable to load project tasks.' });
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const taskId = Number(req.params.id);

  try {
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!tasks || tasks.length === 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const task = tasks[0];

    // Get comments for this task
    const [comments] = await db.query(
      'SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );

    // Get activities related to this task
    const [activities] = await db.query(
      'SELECT * FROM activities WHERE task_id = ? ORDER BY created_at DESC',
      [taskId]
    );

    res.status(200).json({
      task: {
        ...task,
        comments: comments || [],
        activities: activities || [],
      },
    });
  } catch (error) {
    console.error('getTaskById error:', error);
    res.status(500).json({ error: 'Unable to load task details.' });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id || req.body.project_id);
  const userId = req.user?.id;
  const userName = req.user?.name || 'A team member';

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const { title, description, status, priority, assigned_to, due_date, labels } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Task title is required.' });
    return;
  }

  try {
    const taskStatus = status || 'To Do';
    const taskPriority = priority || 'Medium';
    const assignedTo = assigned_to ? Number(assigned_to) : null;
    const cleanDueDate = due_date ? String(due_date).split('T')[0] : null;
    const cleanLabels = typeof labels === 'string' ? labels : Array.isArray(labels) ? labels.join(', ') : '';

    // Calculate next position in that status column
    const [existingTasks] = await db.query('SELECT * FROM tasks WHERE project_id = ?', [projectId]);
    const columnCount = (existingTasks || []).filter((t: any) => t.status === taskStatus).length;

    const [result] = await db.query(
      'INSERT INTO TASKS (project_id, title, description, status, priority, assigned_to, created_by, due_date, labels, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        projectId,
        title.trim(),
        description || '',
        taskStatus,
        taskPriority,
        assignedTo,
        userId,
        cleanDueDate,
        cleanLabels,
        columnCount + 1,
      ]
    );

    const newTaskId = (result as any)?.insertId || Date.now();

    // Log activity
    await logActivity(
      projectId,
      newTaskId,
      userId,
      'created task',
      `Created task "${title.trim()}"`,
      ioInstance || undefined
    );

    // Notify assigned user if different from creator
    if (assignedTo && assignedTo !== userId) {
      await logActivity(
        projectId,
        newTaskId,
        userId,
        'assigned task',
        `Assigned task "${title.trim()}"`,
        ioInstance || undefined
      );

      await createNotification(
        assignedTo,
        'Task Assigned',
        `${userName} assigned you to task: ${title.trim()}`,
        'task',
        `/projects/${projectId}`,
        ioInstance || undefined
      );
    }

    const [created] = await db.query('SELECT * FROM tasks WHERE id = ?', [newTaskId]);
    const createdTask = created[0];

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('task:created', createdTask);
    }

    res.status(201).json({
      message: 'Task created successfully.',
      task: createdTask,
    });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ error: 'Unable to create the task. Please try again.' });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const taskId = Number(req.params.id);
  const userId = req.user?.id;
  const userName = req.user?.name || 'A team member';

  const { title, description, status, priority, assigned_to, due_date, labels } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Task title is required.' });
    return;
  }

  try {
    const [existing] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!existing || existing.length === 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const currentTask = existing[0];
    const projectId = currentTask.project_id;
    const taskStatus = status || currentTask.status;
    const taskPriority = priority || currentTask.priority;
    const assignedTo = assigned_to !== undefined ? (assigned_to ? Number(assigned_to) : null) : currentTask.assigned_to;
    const cleanDueDate = due_date ? String(due_date).split('T')[0] : null;
    const cleanLabels = typeof labels === 'string' ? labels : Array.isArray(labels) ? labels.join(', ') : '';

    await db.query(
      'UPDATE TASKS SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?, labels = ? WHERE id = ?',
      [title.trim(), description || '', taskStatus, taskPriority, assignedTo, cleanDueDate, cleanLabels, taskId]
    );

    // Log assignment change if assigned to someone new
    if (assignedTo && assignedTo !== currentTask.assigned_to && userId) {
      await logActivity(
        projectId,
        taskId,
        userId,
        'assigned task',
        `Assigned task "${title.trim()}"`,
        ioInstance || undefined
      );

      if (assignedTo !== userId) {
        await createNotification(
          assignedTo,
          'Task Assigned',
          `${userName} assigned you to task: ${title.trim()}`,
          'task',
          `/projects/${projectId}`,
          ioInstance || undefined
        );
      }
    } else if (userId) {
      await logActivity(
        projectId,
        taskId,
        userId,
        'updated task',
        `Updated details for task "${title.trim()}"`,
        ioInstance || undefined
      );
    }

    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const updatedTask = updated[0];

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('task:updated', updatedTask);
    }

    res.status(200).json({
      message: 'Task updated successfully.',
      task: updatedTask,
    });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ error: 'Unable to update task.' });
  }
}

export async function moveTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const taskId = Number(req.params.id);
  const userId = req.user?.id;
  const userName = req.user?.name || 'A team member';
  const { status, position } = req.body;

  const validStatuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'A valid status is required.' });
    return;
  }

  try {
    const [existing] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!existing || existing.length === 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const currentTask = existing[0];
    const oldStatus = currentTask.status;
    const projectId = currentTask.project_id;
    const targetPosition = Number(position) || 1;

    await db.query(
      'UPDATE TASKS SET status = ?, position = ? WHERE id = ?',
      [status, targetPosition, taskId]
    );

    // If status changed, log activity and trigger notifications
    if (oldStatus !== status && userId) {
      const actionText = status === 'Completed' ? 'completed task' : 'moved task';
      const detailsText = status === 'Completed'
        ? `Completed task "${currentTask.title}"`
        : `Moved task "${currentTask.title}" to ${status}`;

      await logActivity(
        projectId,
        taskId,
        userId,
        actionText,
        detailsText,
        ioInstance || undefined
      );

      // If moved to review or completed, notify task creator or assigned user
      const notifyUserId = currentTask.assigned_to && currentTask.assigned_to !== userId
        ? currentTask.assigned_to
        : currentTask.created_by !== userId ? currentTask.created_by : null;

      if (notifyUserId) {
        await createNotification(
          notifyUserId,
          status === 'Review' ? 'Task In Review' : status === 'Completed' ? 'Task Completed' : 'Task Status Updated',
          `${userName} moved task "${currentTask.title}" to ${status}`,
          'task',
          `/projects/${projectId}`,
          ioInstance || undefined
        );
      }
    }

    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const updatedTask = updated[0];

    const movePayload = {
      task: updatedTask,
      taskId,
      projectId,
      oldStatus,
      newStatus: status,
      position: targetPosition,
    };

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('task:moved', movePayload);
    }

    res.status(200).json({
      message: 'Task moved successfully.',
      task: updatedTask,
    });
  } catch (error) {
    console.error('moveTask error:', error);
    res.status(500).json({ error: 'Unable to move task.' });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const taskId = Number(req.params.id);
  const userId = req.user?.id;

  try {
    const [existing] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!existing || existing.length === 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const task = existing[0];
    const projectId = task.project_id;

    await db.query('DELETE FROM TASKS WHERE id = ?', [taskId]);

    if (userId) {
      await logActivity(
        projectId,
        null,
        userId,
        'deleted task',
        `Deleted task "${task.title}"`,
        ioInstance || undefined
      );
    }

    const payload = { taskId, projectId };
    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('task:deleted', payload);
    }

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ error: 'Unable to delete task.' });
  }
}

export async function getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  try {
    const [tasks] = await db.query('SELECT * FROM tasks WHERE assigned_to = ?', [userId]);
    res.status(200).json({ tasks: tasks || [] });
  } catch (error) {
    console.error('getMyTasks error:', error);
    res.status(500).json({ error: 'Unable to load your tasks.' });
  }
}
