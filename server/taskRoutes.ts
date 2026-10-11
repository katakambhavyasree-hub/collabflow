import { Router } from 'express';
import {
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  getMyTasks,
} from '../controllers/taskController.js';
import { getCommentsByTask, addComment } from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// My tasks endpoint
router.get('/my', getMyTasks);

// Individual task endpoints
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/move', moveTask);
router.put('/:id/move', moveTask);
router.delete('/:id', deleteTask);

// Comments under task
router.get('/:id/comments', getCommentsByTask);
router.post('/:id/comments', addComment);

export default router;
