import { Response } from 'express';
import db from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getActivitiesByProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);

  try {
    const [activities] = await db.query(
      'SELECT a.*, u.name as user_name, u.avatar_url as user_avatar, t.title as task_title FROM activities a JOIN users u ON a.user_id = u.id LEFT JOIN tasks t ON a.task_id = t.id WHERE a.project_id = ? ORDER BY a.created_at DESC',
      [projectId]
    );

    res.status(200).json({ activities: activities || [] });
  } catch (error) {
    console.error('getActivitiesByProject error:', error);
    res.status(500).json({ error: 'Unable to load project activities.' });
  }
}
