import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import db from '../config/database.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  projectRole?: string;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please log in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    return;
  }

  req.user = payload;
  next();
}

export function requireProjectRole(allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required' });
      return;
    }

    try {
      const [members] = await db.query(
        'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
        [Number(projectId), req.user.id]
      );

      if (!members || members.length === 0) {
        res.status(403).json({ error: 'You do not have permission to perform this action in this project.' });
        return;
      }

      const userRole = members[0].role;
      req.projectRole = userRole;

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error verifying project role:', error);
      res.status(500).json({ error: 'Internal server error validating permissions' });
    }
  };
}
