import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId } from '../utils/helpers.js';

// Global socket emitter reference for real-time dispatch
let socketIoInstance = null;

export function setSocketIo(io) {
  socketIoInstance = io;
}

export class NotificationService {
  static async createNotification({ userId, actorId = null, type, postId = null, message }) {
    if (!userId || userId === actorId) return null;

    const isConnected = await checkPgConnection();
    const notifId = generateId('notif');
    const now = new Date().toISOString();
    let notification = null;

    if (isConnected) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, actor_id, post_id, message, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
        [notifId, userId, type, actorId, postId, message]
      );

      const res = await pool.query(
        `SELECT n.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as actor
        FROM notifications n
        LEFT JOIN users u ON u.id = n.actor_id
        LEFT JOIN user_profiles prof ON prof.user_id = u.id
        WHERE n.id = $1`,
        [notifId]
      );
      notification = res.rows[0];
    } else {
      await memoryStore.init();
      const newNotif = {
        id: notifId,
        user_id: userId,
        type,
        actor_id: actorId,
        post_id: postId,
        message,
        is_read: false,
        read_at: null,
        created_at: now,
      };

      memoryStore.tables.notifications.unshift(newNotif);
      const actor = actorId ? memoryStore.getPopulatedUser(actorId) : null;
      notification = {
        ...newNotif,
        actor: actor ? {
          id: actor.id,
          full_name: actor.full_name,
          username: actor.username,
          avatar_url: actor.avatar_url,
        } : null,
      };
    }

    // Emit live event via Socket.IO if user is connected
    if (socketIoInstance && notification) {
      socketIoInstance.to(`user:${userId}`).emit('notification_received', notification);
    }

    return notification;
  }

  static async getUserNotifications(userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT n.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as actor
        FROM notifications n
        LEFT JOIN users u ON u.id = n.actor_id
        LEFT JOIN user_profiles prof ON prof.user_id = u.id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT 50`,
        [userId]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      return memoryStore.tables.notifications
        .filter(n => n.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(n => {
          const actor = n.actor_id ? memoryStore.getPopulatedUser(n.actor_id) : null;
          return {
            ...n,
            actor: actor ? {
              id: actor.id,
              full_name: actor.full_name,
              username: actor.username,
              avatar_url: actor.avatar_url,
            } : null,
          };
        });
    }
  }

  static async markNotificationAsRead(notificationId, userId) {
    const isConnected = await checkPgConnection();
    const now = new Date().toISOString();

    if (isConnected) {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      return { success: true };
    } else {
      await memoryStore.init();
      const notif = memoryStore.tables.notifications.find(n => n.id === notificationId && n.user_id === userId);
      if (notif) {
        notif.is_read = true;
        notif.read_at = now;
      }
      return { success: true };
    }
  }

  static async markAllNotificationsAsRead(userId) {
    const isConnected = await checkPgConnection();
    const now = new Date().toISOString();

    if (isConnected) {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
      return { success: true };
    } else {
      await memoryStore.init();
      memoryStore.tables.notifications
        .filter(n => n.user_id === userId)
        .forEach(n => {
          n.is_read = true;
          n.read_at = now;
        });
      return { success: true };
    }
  }

  static async getUnreadCount(userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const res = await pool.query(
        'SELECT COUNT(*)::int as unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [userId]
      );
      return res.rows[0].unread_count;
    } else {
      await memoryStore.init();
      return memoryStore.tables.notifications.filter(n => n.user_id === userId && !n.is_read).length;
    }
  }
}
