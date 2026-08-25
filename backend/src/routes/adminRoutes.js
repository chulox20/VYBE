import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Reports public creation for authenticated users
export const reportRouter = Router();
reportRouter.post('/', authenticate, AdminController.createReport);

// Admin only routes
router.use(authenticate, requireAdmin);

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.put('/users/:id/status', AdminController.updateUserStatus);
router.get('/reports', AdminController.getReports);
router.put('/reports/:id/resolve', AdminController.resolveReport);

export default router;
