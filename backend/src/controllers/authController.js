import { AuthService } from '../services/authService.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/index.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(validated);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const updated = await AuthService.updateProfile(req.user.id, validated);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
