import { CommentService } from '../services/commentService.js';
import { createCommentSchema } from '../validators/index.js';

export class CommentController {
  static async createComment(req, res, next) {
    try {
      const validated = createCommentSchema.parse(req.body);
      const comment = await CommentService.createComment(req.params.postId, req.user.id, validated);
      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req, res, next) {
    try {
      const comments = await CommentService.getCommentsByPost(req.params.postId);
      res.json({ success: true, data: comments });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req, res, next) {
    try {
      const isAdmin = req.user.role === 'admin';
      const result = await CommentService.deleteComment(req.params.id, req.user.id, isAdmin);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
