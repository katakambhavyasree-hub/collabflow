import { Response } from 'express';
import db from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  try {
    // 1. Projects user is associated with
    const [projects] = await db.query(
      'SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ?',
      [userId]
    );

    const projectList = projects || [];
    const totalProjects = projectList.length;
    const activeProjects = projectList.filter((p: any) => p.status === 'Active').length;

    // 2. User tasks
    const [myTasks] = await db.query('SELECT * FROM tasks WHERE assigned_to = ?', [userId]);
    const taskList = myTasks || [];
    const totalMyTasks = taskList.length;
    const completedTasks = taskList.filter((t: any) => t.status === 'Completed').length;

    // 3. Recent projects (top 3)
    const recentProjects = projectList.slice(0, 3);

    // 4. Upcoming tasks (not completed, sorted by due_date ascending)
    const upcomingTasks = taskList
      .filter((t: any) => t.status !== 'Completed' && t.due_date)
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    // 5. Recent activity from projects the user belongs to
    const projectIds = projectList.map((p: any) => p.id);
    let recentActivities: any[] = [];

    if (projectIds.length > 0) {
      const [allActs] = await db.query('SELECT * FROM activities WHERE project_id = ?', [projectIds[0]]);
      recentActivities = (allActs || []).slice(0, 6);
    }

    res.status(200).json({
      userName: req.user?.name || 'User',
      stats: {
        totalProjects,
        activeProjects,
        myTasks: totalMyTasks,
        completedTasks,
      },
      recentProjects,
      upcomingTasks,
      recentActivities,
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    res.status(500).json({ error: 'Unable to load dashboard data.' });
  }
}

export async function globalSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = String(req.query.q || '').trim();

  if (!query) {
    res.status(200).json({ projects: [], tasks: [] });
    return;
  }

  try {
    const [results] = await db.query('SEARCH', [query]);
    if (results && results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(200).json({ projects: [], tasks: [] });
    }
  } catch (error) {
    console.error('globalSearch error:', error);
    res.status(500).json({ error: 'Search operation failed.' });
  }
}
