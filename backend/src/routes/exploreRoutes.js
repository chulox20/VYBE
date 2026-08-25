import { Router } from 'express';
import { ExploreController } from '../controllers/exploreController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/trending', ExploreController.getTrending);
router.get('/popular', optionalAuth, ExploreController.getPopularPosts);
router.get('/search', optionalAuth, ExploreController.search);

export default router;
