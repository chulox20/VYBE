import { Router } from 'express';
import { MessageController } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', MessageController.getConversations);
router.get('/:conversationId', MessageController.getMessages);
router.post('/send', MessageController.sendMessage);
router.post('/:conversationId/read', MessageController.markAsRead);

export default router;
