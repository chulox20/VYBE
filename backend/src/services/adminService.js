import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class AdminService {
  static async createReport(reporterId, { target_type, target_id, reason, notes = '' }) {
    const isConnected = await checkPgConnection();
    const reportId = generateId('rep');
    const now = new Date().toISOString();

    if (isConnected) {
      await pool.query(
        `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [reportId, reporterId, target_type, target_id, reason, notes]
      );
      return { success: true, message: 'Reporte enviado a los moderadores de VYBE.' };
    } else {
      await memoryStore.init();
      memoryStore.tables.reports.unshift({
        id: reportId,
        reporter_id: reporterId,
        target_type,
        target_id,
        reason,
        notes,
        status: 'pending',
        resolved_by: null,
        resolved_at: null,
        created_at: now,
      });
      return { success: true, message: 'Reporte enviado a los moderadores de VYBE.' };
    }
  }

  static async getStats() {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const usersCount = await pool.query('SELECT COUNT(*)::int as count FROM users');
      const postsCount = await pool.query('SELECT COUNT(*)::int as count FROM posts');
      const communitiesCount = await pool.query('SELECT COUNT(*)::int as count FROM communities');
      const pendingReportsCount = await pool.query("SELECT COUNT(*)::int as count FROM reports WHERE status = 'pending'");
      const activeUsersCount = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE status = 'active'");
      const suspendedCount = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE status IN ('suspended', 'banned')");

      return {
        total_users: usersCount.rows[0].count,
        total_posts: postsCount.rows[0].count,
        total_communities: communitiesCount.rows[0].count,
        pending_reports: pendingReportsCount.rows[0].count,
        active_users: activeUsersCount.rows[0].count,
        suspended_users: suspendedCount.rows[0].count,
      };
    } else {
      await memoryStore.init();
      return {
        total_users: memoryStore.tables.users.length,
        total_posts: memoryStore.tables.posts.length,
        total_communities: memoryStore.tables.communities.length,
        pending_reports: memoryStore.tables.reports.filter(r => r.status === 'pending').length,
        active_users: memoryStore.tables.users.filter(u => u.status === 'active').length,
        suspended_users: memoryStore.tables.users.filter(u => u.status === 'suspended' || u.status === 'banned').length,
      };
    }
  }

  static async getUsersList({ status = null, role = null, search = null } = {}) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      let queryText = `
        SELECT u.id, u.email, u.role, u.status, u.created_at,
          p.full_name, p.username, p.avatar_url, p.follower_count, p.post_count
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let idx = 1;

      if (status && status !== 'all') {
        queryText += ` AND u.status = $${idx++}`;
        params.push(status);
      }

      if (role && role !== 'all') {
        queryText += ` AND u.role = $${idx++}`;
        params.push(role);
      }

      if (search) {
        queryText += ` AND (p.username ILIKE $${idx} OR p.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }

      queryText += ` ORDER BY u.created_at DESC`;
      const result = await pool.query(queryText, params);
      return result.rows;
    } else {
      await memoryStore.init();
      let list = memoryStore.tables.users.map(u => memoryStore.getPopulatedUser(u.id));

      if (status && status !== 'all') {
        list = list.filter(u => u.status === status);
      }

      if (role && role !== 'all') {
        list = list.filter(u => u.role === role);
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(u => u.username.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }

      return list;
    }
  }

  static async updateUserStatus(targetUserId, status) {
    if (!['active', 'suspended', 'banned'].includes(status)) {
      const err = new Error('Estado de usuario inválido.');
      err.statusCode = 400;
      throw err;
    }

    const isConnected = await checkPgConnection();
    if (isConnected) {
      await pool.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, targetUserId]);
      return { success: true, status };
    } else {
      await memoryStore.init();
      const user = memoryStore.tables.users.find(u => u.id === targetUserId);
      if (!user) {
        const err = new Error('Usuario no encontrado.');
        err.statusCode = 404;
        throw err;
      }
      user.status = status;
      user.updated_at = new Date().toISOString();
      return { success: true, status };
    }
  }

  static async getReportsList({ status = null } = {}) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      let queryText = `
        SELECT r.*,
          json_build_object('id', rep_u.id, 'username', rep_p.username, 'full_name', rep_p.full_name, 'avatar_url', rep_p.avatar_url) as reporter,
          json_build_object('id', adm_u.id, 'username', adm_p.username, 'full_name', adm_p.full_name) as resolver
        FROM reports r
        JOIN users rep_u ON rep_u.id = r.reporter_id
        JOIN user_profiles rep_p ON rep_p.user_id = r.reporter_id
        LEFT JOIN users adm_u ON adm_u.id = r.resolved_by
        LEFT JOIN user_profiles adm_p ON adm_p.user_id = r.resolved_by
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'all') {
        queryText += ` AND r.status = $1`;
        params.push(status);
      }

      queryText += ` ORDER BY CASE WHEN r.status = 'pending' THEN 1 ELSE 2 END, r.created_at DESC`;
      const result = await pool.query(queryText, params);
      return result.rows;
    } else {
      await memoryStore.init();
      let list = [...memoryStore.tables.reports];
      if (status && status !== 'all') {
        list = list.filter(r => r.status === status);
      }

      return list.map(r => {
        const reporter = memoryStore.getPopulatedUser(r.reporter_id);
        const resolver = r.resolved_by ? memoryStore.getPopulatedUser(r.resolved_by) : null;
        return {
          ...r,
          reporter: { id: reporter?.id, username: reporter?.username, full_name: reporter?.full_name, avatar_url: reporter?.avatar_url },
          resolver: resolver ? { id: resolver.id, username: resolver.username, full_name: resolver.full_name } : null,
        };
      });
    }
  }

  static async resolveReport(reportId, adminId, { status, notes = '', action = 'none' }) {
    const isConnected = await checkPgConnection();
    const now = new Date().toISOString();

    if (isConnected) {
      const repRes = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId]);
      if (repRes.rows.length === 0) {
        const err = new Error('Reporte no encontrado.');
        err.statusCode = 404;
        throw err;
      }
      const report = repRes.rows[0];

      if (action === 'delete_content') {
        if (report.target_type === 'post') {
          await pool.query('DELETE FROM posts WHERE id = $1', [report.target_id]);
        } else if (report.target_type === 'comment') {
          await pool.query('DELETE FROM comments WHERE id = $1', [report.target_id]);
        }
      } else if (action === 'suspend_user') {
        const targetUserId = report.target_type === 'user' ? report.target_id : null;
        if (targetUserId) {
          await pool.query("UPDATE users SET status = 'suspended' WHERE id = $1", [targetUserId]);
        }
      } else if (action === 'ban_user') {
        const targetUserId = report.target_type === 'user' ? report.target_id : null;
        if (targetUserId) {
          await pool.query("UPDATE users SET status = 'banned' WHERE id = $1", [targetUserId]);
        }
      }

      await pool.query(
        `UPDATE reports SET status = $1, notes = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [status, notes, adminId, reportId]
      );

      return { success: true, message: 'Reporte procesado exitosamente.' };
    } else {
      await memoryStore.init();
      const report = memoryStore.tables.reports.find(r => r.id === reportId);
      if (!report) {
        const err = new Error('Reporte no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      if (action === 'delete_content') {
        if (report.target_type === 'post') {
          const pIdx = memoryStore.tables.posts.findIndex(p => p.id === report.target_id);
          if (pIdx !== -1) memoryStore.tables.posts.splice(pIdx, 1);
        } else if (report.target_type === 'comment') {
          const cIdx = memoryStore.tables.comments.findIndex(c => c.id === report.target_id);
          if (cIdx !== -1) memoryStore.tables.comments.splice(cIdx, 1);
        }
      } else if (action === 'suspend_user' || action === 'ban_user') {
        const statusToSet = action === 'ban_user' ? 'banned' : 'suspended';
        if (report.target_type === 'user') {
          const target = memoryStore.tables.users.find(u => u.id === report.target_id);
          if (target) target.status = statusToSet;
        }
      }

      report.status = status;
      report.notes = notes;
      report.resolved_by = adminId;
      report.resolved_at = now;

      return { success: true, message: 'Reporte procesado exitosamente.' };
    }
  }
}
