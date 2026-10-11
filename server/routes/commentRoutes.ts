import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;
