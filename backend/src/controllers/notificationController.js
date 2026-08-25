import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const notifications = await NotificationService.getUserNotifications(req.user.id);
      const unreadCount = await NotificationService.getUnreadCount(req.user.id);
      res.json({ success: true, data: { notifications, unread_count: unreadCount } });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markNotificationAsRead(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
