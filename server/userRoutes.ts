import { Router } from 'express';
import { updateProfile, updatePassword, getAllUsers, createUser } from '../controllers/userController.js';
import { getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/me', getMe);
router.put('/me', updateProfile);
router.put('/me/password', updatePassword);
router.get('/', getAllUsers);
router.post('/', createUser);

export default router;
