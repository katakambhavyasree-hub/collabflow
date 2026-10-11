import { Server } from 'socket.io';
import db from '../config/database.js';

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string = 'info',
  link: string | null = null,
  io?: Server
): Promise<void> {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, type, link]
    );

    const notificationPayload = {
      id: (result as any)?.insertId || Date.now(),
      user_id: userId,
      title,
      message,
      type,
      link,
      is_read: false,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    if (io) {
      io.to(`user_${userId}`).emit('notification:created', notificationPayload);
      io.to(`user_${userId}`).emit('notification-created', notificationPayload);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
