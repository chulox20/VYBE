import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/suggestions', optionalAuth, UserController.getSuggestedUsers);
router.get('/:username', optionalAuth, UserController.getProfile);
router.post('/:username/follow', authenticate, UserController.toggleFollow);
router.get('/:username/posts', optionalAuth, UserController.getUserPosts);
router.get('/:username/replies', optionalAuth, UserController.getUserReplies);

export default router;
