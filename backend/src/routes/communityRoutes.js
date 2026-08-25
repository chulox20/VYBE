import { Router } from 'express';
import { CommunityController } from '../controllers/communityController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', CommunityController.getCommunities);
router.post('/', authenticate, CommunityController.createCommunity);
router.get('/:slug', optionalAuth, CommunityController.getCommunityBySlug);
router.post('/:slug/join', authenticate, CommunityController.toggleJoinCommunity);
router.get('/:slug/posts', optionalAuth, CommunityController.getCommunityPosts);
router.get('/:slug/members', CommunityController.getCommunityMembers);

export default router;
