import { Router } from 'express';
import { PostController } from '../controllers/postController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/feed', optionalAuth, PostController.getFeed);
router.get('/saved', authenticate, PostController.getSavedPosts);
router.get('/:id', optionalAuth, PostController.getPostById);
router.post('/', authenticate, PostController.createPost);
router.delete('/:id', authenticate, PostController.deletePost);
router.post('/:id/like', authenticate, PostController.toggleLike);
router.post('/:id/save', authenticate, PostController.toggleSave);

export default router;
