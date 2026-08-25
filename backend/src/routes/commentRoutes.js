import { Router } from 'express';
import { CommentController } from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/post/:postId', CommentController.getComments);
router.post('/post/:postId', authenticate, CommentController.createComment);
router.delete('/:id', authenticate, CommentController.deleteComment);

export default router;
