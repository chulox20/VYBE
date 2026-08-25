import { AdminService } from '../services/adminService.js';
import { createReportSchema, updateReportStatusSchema } from '../validators/index.js';

export class AdminController {
  static async createReport(req, res, next) {
    try {
      const validated = createReportSchema.parse(req.body);
      const result = await AdminService.createReport(req.user.id, validated);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req, res, next) {
    try {
      const { status, role, search } = req.query;
      const users = await AdminService.getUsersList({ status, role, search });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await AdminService.updateUserStatus(req.params.id, status);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req, res, next) {
    try {
      const { status } = req.query;
      const reports = await AdminService.getReportsList({ status });
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  static async resolveReport(req, res, next) {
    try {
      const validated = updateReportStatusSchema.parse(req.body);
      const result = await AdminService.resolveReport(req.params.id, req.user.id, validated);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
