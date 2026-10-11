import { Router } from 'express';
import { getActivitiesByProject } from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/:id', getActivitiesByProject);

export default router;
