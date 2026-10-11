import { Response } from 'express';
import { Server } from 'socket.io';
import db from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

let ioInstance: Server | null = null;
export function setProjectSocketIO(io: Server) {
  ioInstance = io;
}

export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  try {
    const [projects] = await db.query(
      'SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ?',
      [userId]
    );
    res.status(200).json({ projects });
  } catch (error) {
    console.error('getProjects error:', error);
    res.status(500).json({ error: 'Unable to retrieve projects.' });
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  const userId = req.user?.id;

  try {
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      res.status(404).json({ error: 'The project could not be found.' });
      return;
    }

    const project = projects[0];

    // Determine current user's role in this project
    const [members] = await db.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    const userRole = members && members.length > 0 ? members[0].role : null;

    res.status(200).json({
      project: {
        ...project,
        currentUserRole: userRole,
      },
    });
  } catch (error) {
    console.error('getProjectById error:', error);
    res.status(500).json({ error: 'Unable to load project details.' });
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const userName = req.user?.name || 'User';
  const { name, description, status } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Project name is required.' });
    return;
  }

  try {
    const projectStatus = status || 'Active';
    const [result] = await db.query(
      'INSERT INTO PROJECTS (name, description, status, owner_id) VALUES (?, ?, ?, ?)',
      [name.trim(), description || '', projectStatus, userId]
    );

    const newProjectId = (result as any)?.insertId;

    // Log activity
    await logActivity(
      newProjectId,
      null,
      userId,
      'created project',
      `Created project "${name.trim()}"`,
      ioInstance || undefined
    );

    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [newProjectId]);
    const createdProject = projects[0];

    if (ioInstance) {
      ioInstance.emit('project:created', createdProject);
    }

    res.status(201).json({
      message: 'Project created successfully.',
      project: createdProject,
    });
  } catch (error) {
    console.error('createProject error:', error);
    res.status(500).json({ error: 'Unable to create project.' });
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  const userId = req.user?.id;
  const { name, description, status } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Project name is required.' });
    return;
  }

  try {
    // Check permission (Owner or Admin)
    const [members] = await db.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    const role = members && members.length > 0 ? members[0].role : null;
    if (role !== 'Owner' && role !== 'Admin') {
      res.status(403).json({ error: 'You do not have permission to edit project settings.' });
      return;
    }

    await db.query('UPDATE PROJECTS SET name = ?, description = ?, status = ? WHERE id = ?', [
      name.trim(),
      description || '',
      status || 'Active',
      projectId,
    ]);

    if (userId) {
      await logActivity(
        projectId,
        null,
        userId,
        'updated project',
        `Updated project details for "${name.trim()}"`,
        ioInstance || undefined
      );
    }

    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    const updated = projects[0];

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('project:updated', updated);
    }

    res.status(200).json({
      message: 'Project updated successfully.',
      project: updated,
    });
  } catch (error) {
    console.error('updateProject error:', error);
    res.status(500).json({ error: 'Unable to update project.' });
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  const userId = req.user?.id;

  try {
    const [members] = await db.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    const role = members && members.length > 0 ? members[0].role : null;
    if (role !== 'Owner') {
      res.status(403).json({ error: 'Only the project Owner can delete this project.' });
      return;
    }

    await db.query('DELETE FROM PROJECTS WHERE id = ?', [projectId]);

    if (ioInstance) {
      ioInstance.emit('project:deleted', { id: projectId });
    }

    res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('deleteProject error:', error);
    res.status(500).json({ error: 'Unable to delete project.' });
  }
}

export async function getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);

  try {
    const [members] = await db.query(
      'SELECT pm.* FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
      [projectId]
    );

    res.status(200).json({ members });
  } catch (error) {
    console.error('getMembers error:', error);
    res.status(500).json({ error: 'Unable to retrieve project members.' });
  }
}

export async function addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  const currentUserId = req.user?.id;
  const currentUserName = req.user?.name || 'A team member';
  const { user_id, email, role } = req.body;

  try {
    // Check requester role
    const [currMembers] = await db.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, currentUserId]
    );

    const myRole = currMembers && currMembers.length > 0 ? currMembers[0].role : null;
    if (myRole !== 'Owner' && myRole !== 'Admin') {
      res.status(403).json({ error: 'You do not have permission to manage members.' });
      return;
    }

    let targetUserId = user_id ? Number(user_id) : null;

    if (!targetUserId && email) {
      const [found] = await db.query('SELECT id FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
      if (found && found.length > 0) {
        targetUserId = found[0].id;
      } else {
        res.status(404).json({ error: 'User with this email was not found.' });
        return;
      }
    }

    if (!targetUserId) {
      res.status(400).json({ error: 'User ID or valid email is required.' });
      return;
    }

    // Check if already a member
    const [existing] = await db.query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );

    if (existing && existing.length > 0) {
      res.status(409).json({ error: 'This user is already a member of the project.' });
      return;
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Member';
    await db.query(
      'INSERT INTO PROJECT_MEMBERS (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, targetUserId, assignedRole]
    );

    // Fetch project title
    const [projs] = await db.query('SELECT name FROM projects WHERE id = ?', [projectId]);
    const projectName = projs && projs.length > 0 ? projs[0].name : 'a project';

    // Activity & notification
    if (currentUserId) {
      await logActivity(
        projectId,
        null,
        currentUserId,
        'added member',
        `Added member with role ${assignedRole}`,
        ioInstance || undefined
      );
    }

    await createNotification(
      targetUserId,
      'Project Invitation',
      `${currentUserName} added you to project "${projectName}" as ${assignedRole}.`,
      'project',
      `/projects/${projectId}`,
      ioInstance || undefined
    );

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('member:added', {
        projectId,
        userId: targetUserId,
        role: assignedRole,
      });
      ioInstance.to(`project_${projectId}`).emit('member-added', {
        projectId,
        userId: targetUserId,
        role: assignedRole,
      });
    }

    const [members] = await db.query(
      'SELECT pm.* FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
      [projectId]
    );

    res.status(201).json({
      message: 'Member added successfully.',
      members,
    });
  } catch (error) {
    console.error('addMember error:', error);
    res.status(500).json({ error: 'Unable to add member.' });
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const currentUserId = req.user?.id;

  try {
    const [currMembers] = await db.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, currentUserId]
    );

    const myRole = currMembers && currMembers.length > 0 ? currMembers[0].role : null;
    if (myRole !== 'Owner' && myRole !== 'Admin') {
      res.status(403).json({ error: 'You do not have permission to remove members.' });
      return;
    }

    // Cannot remove project owner
    const [targetMembers] = await db.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );

    if (targetMembers && targetMembers[0]?.role === 'Owner') {
      res.status(403).json({ error: 'The project Owner cannot be removed.' });
      return;
    }

    await db.query(
      'DELETE FROM PROJECT_MEMBERS WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );

    if (currentUserId) {
      await logActivity(
        projectId,
        null,
        currentUserId,
        'removed member',
        'Removed a member from project',
        ioInstance || undefined
      );
    }

    if (ioInstance) {
      ioInstance.to(`project_${projectId}`).emit('member:removed', {
        projectId,
        userId: targetUserId,
      });
      ioInstance.to(`project_${projectId}`).emit('member-removed', {
        projectId,
        userId: targetUserId,
      });
    }

    res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(500).json({ error: 'Unable to remove member.' });
  }
}
