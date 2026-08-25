import { ExploreService } from '../services/exploreService.js';
import { PostService } from '../services/postService.js';

export class ExploreController {
  static async getTrending(req, res, next) {
    try {
      const trending = await ExploreService.getTrendingHashtags();
      res.json({ success: true, data: trending });
    } catch (error) {
      next(error);
    }
  }

  static async getPopularPosts(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const feed = await PostService.getFeed(currentUserId, { limit: 20, tab: 'popular' });
      res.json({ success: true, data: feed.posts });
    } catch (error) {
      next(error);
    }
  }

  static async search(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const { q } = req.query;
      const results = await ExploreService.searchAll(q, currentUserId);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}
