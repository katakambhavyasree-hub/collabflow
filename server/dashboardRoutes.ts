import { Router } from 'express';
import { getDashboardOverview, globalSearch } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/overview', getDashboardOverview);
router.get('/search', globalSearch);

export default router;
