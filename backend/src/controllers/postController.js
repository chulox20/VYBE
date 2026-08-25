import { PostService } from '../services/postService.js';
import { createPostSchema } from '../validators/index.js';

export class PostController {
  static async createPost(req, res, next) {
    try {
      const validated = createPostSchema.parse(req.body);
      const post = await PostService.createPost(req.user.id, validated);
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  static async getFeed(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const { limit, cursor, tab } = req.query;
      const feed = await PostService.getFeed(currentUserId, { limit, cursor, tab });
      res.json({ success: true, data: feed });
    } catch (error) {
      next(error);
    }
  }

  static async getPostById(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const post = await PostService.getPostById(req.params.id, currentUserId);
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  static async deletePost(req, res, next) {
    try {
      const isAdmin = req.user.role === 'admin';
      const result = await PostService.deletePost(req.params.id, req.user.id, isAdmin);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async toggleLike(req, res, next) {
    try {
      const result = await PostService.toggleLike(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async toggleSave(req, res, next) {
    try {
      const result = await PostService.toggleSave(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSavedPosts(req, res, next) {
    try {
      const posts = await PostService.getSavedPosts(req.user.id);
      res.json({ success: true, data: posts });
    } catch (error) {
      next(error);
    }
  }
}
