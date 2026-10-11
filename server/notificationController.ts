import { Response } from 'express';
import db from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({ notifications: notifications || [] });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ error: 'Unable to load notifications.' });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const notificationId = Number(req.params.id);

  try {
    await db.query('UPDATE NOTIFICATIONS SET is_read = TRUE WHERE id = ?', [notificationId]);
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: 'Unable to update notification.' });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  try {
    await db.query('UPDATE NOTIFICATIONS SET is_read = TRUE WHERE user_id = ?', [userId]);
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ error: 'Unable to mark notifications as read.' });
  }
}
