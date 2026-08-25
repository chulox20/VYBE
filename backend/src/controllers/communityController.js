import { CommunityService } from '../services/communityService.js';
import { createCommunitySchema } from '../validators/index.js';

export class CommunityController {
  static async getCommunities(req, res, next) {
    try {
      const { category, search } = req.query;
      const communities = await CommunityService.getCommunities({ category, search });
      res.json({ success: true, data: communities });
    } catch (error) {
      next(error);
    }
  }

  static async getCommunityBySlug(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const community = await CommunityService.getCommunityBySlug(req.params.slug, currentUserId);
      res.json({ success: true, data: community });
    } catch (error) {
      next(error);
    }
  }

  static async createCommunity(req, res, next) {
    try {
      const validated = createCommunitySchema.parse(req.body);
      const community = await CommunityService.createCommunity(req.user.id, validated);
      res.status(201).json({ success: true, data: community });
    } catch (error) {
      next(error);
    }
  }

  static async toggleJoinCommunity(req, res, next) {
    try {
      const result = await CommunityService.toggleJoinCommunity(req.params.slug, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCommunityPosts(req, res, next) {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const posts = await CommunityService.getCommunityPosts(req.params.slug, currentUserId);
      res.json({ success: true, data: posts });
    } catch (error) {
      next(error);
    }
  }

  static async getCommunityMembers(req, res, next) {
    try {
      const members = await CommunityService.getCommunityMembers(req.params.slug);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }
}
