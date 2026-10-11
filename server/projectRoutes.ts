import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getMembers,
  addMember,
  removeMember,
} from '../controllers/projectController.js';
import { getTasksByProject, createTask } from '../controllers/taskController.js';
import { getActivitiesByProject } from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Project CRUD
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Members
router.get('/:id/members', getMembers);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

// Tasks under project
router.get('/:id/tasks', getTasksByProject);
router.post('/:id/tasks', createTask);

// Activities under project
router.get('/:id/activities', getActivitiesByProject);

export default router;
