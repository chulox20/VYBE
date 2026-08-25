import { UserService } from '../services/userService.js';

export class UserController {
  static async getProfile(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const profile = await UserService.getProfileByUsername(req.params.username, currentUserId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async toggleFollow(req, res, next) {
    try {
      const result = await UserService.toggleFollow(req.user.id, req.params.username);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUserPosts(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const posts = await UserService.getUserPosts(req.params.username, currentUserId);
      res.json({ success: true, data: posts });
    } catch (error) {
      next(error);
    }
  }

  static async getUserReplies(req, res, next) {
    try {
      const replies = await UserService.getUserReplies(req.params.username);
      res.json({ success: true, data: replies });
    } catch (error) {
      next(error);
    }
  }

  static async getSuggestedUsers(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const limit = req.query.limit || 5;
      const suggestions = await UserService.getSuggestedUsers(currentUserId, limit);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }
}
