import { Server } from 'socket.io';
import db from '../config/database.js';

export async function logActivity(
  projectId: number,
  taskId: number | null,
  userId: number,
  action: string,
  details: string | null,
  io?: Server
): Promise<void> {
  try {
    const [result] = await db.query(
      'INSERT INTO activities (project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)',
      [projectId, taskId, userId, action, details]
    );

    // Fetch user info for real-time broadcast
    const [users] = await db.query('SELECT name, avatar_url FROM users WHERE id = ?', [userId]);
    const user = users && users.length > 0 ? users[0] : { name: 'User', avatar_url: null };

    const activityPayload = {
      id: (result as any)?.insertId || Date.now(),
      project_id: projectId,
      task_id: taskId,
      user_id: userId,
      user_name: user.name,
      user_avatar: user.avatar_url,
      action,
      details,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    if (io) {
      io.to(`project_${projectId}`).emit('activity:new', activityPayload);
      io.to(`project_${projectId}`).emit('activity-created', activityPayload);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
