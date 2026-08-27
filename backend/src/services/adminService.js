import { pool, checkPgConnection, withTransaction } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId } from '../utils/helpers.js';
import { PostService } from './postService.js';
import { CommentService } from './commentService.js';

export class AdminService {
  static async createReport(reporterId, { target_type, target_id, reason, details = '' }) {
    const isConnected = await checkPgConnection();
    const reportId = generateId('rep');
    const now = new Date().toISOString();

    if (isConnected) {
      const res = await pool.query(
        `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [reportId, reporterId, target_type, target_id, reason, details]
      );
      return res.rows[0];
    } else {
      await memoryStore.init();
      const newReport = {
        id: reportId,
        reporter_id: reporterId,
        target_type,
        target_id,
        reason,
        details,
        status: 'pending',
        action_taken: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: now,
      };
      memoryStore.tables.reports.push(newReport);
      return {
        ...newReport,
        reporter: memoryStore.getPopulatedUser(reporterId),
      };
    }
  }

  static async getDashboardStats() {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const [usersCount, postsCount, communitiesCount, pendingReports, messagesCount] = await Promise.all([
        pool.query('SELECT COUNT(*)::int as count FROM users'),
        pool.query('SELECT COUNT(*)::int as count FROM posts'),
        pool.query('SELECT COUNT(*)::int as count FROM communities'),
        pool.query("SELECT COUNT(*)::int as count FROM reports WHERE status = 'pending'"),
        pool.query('SELECT COUNT(*)::int as count FROM messages'),
      ]);

      return {
        total_users: usersCount.rows[0].count,
        total_posts: postsCount.rows[0].count,
        total_communities: communitiesCount.rows[0].count,
        pending_reports: pendingReports.rows[0].count,
        total_messages: messagesCount.rows[0].count,
      };
    } else {
      await memoryStore.init();
      return {
        total_users: memoryStore.tables.users.length,
        total_posts: memoryStore.tables.posts.length,
        total_communities: memoryStore.tables.communities.length,
        pending_reports: memoryStore.tables.reports.filter(r => r.status === 'pending').length,
        total_messages: memoryStore.tables.messages.length,
      };
    }
  }

  static async listUsers({ status = null, role = null, search = null } = {}) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      let queryText = `
        SELECT u.id, u.email, u.role, u.status, u.created_at,
          p.full_name, p.username, p.avatar_url, p.follower_count, p.following_count, p.post_count
        FROM users u
        JOIN user_profiles p ON p.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let idx = 1;

      if (status) {
        queryText += ` AND u.status = $${idx++}`;
        params.push(status);
      }
      if (role) {
        queryText += ` AND u.role = $${idx++}`;
        params.push(role);
      }
      if (search) {
        queryText += ` AND (LOWER(p.username) LIKE LOWER($${idx}) OR LOWER(p.full_name) LIKE LOWER($${idx}) OR LOWER(u.email) LIKE LOWER($${idx}))`;
        params.push(`%${search}%`);
      }

      queryText += ` ORDER BY u.created_at DESC`;
      const result = await pool.query(queryText, params);
      return result.rows;
    } else {
      await memoryStore.init();
      let users = memoryStore.tables.users.map(u => {
        const prof = memoryStore.tables.user_profiles.find(p => p.user_id === u.id) || {};
        return {
          id: u.id,
          email: u.email,
          role: u.role,
          status: u.status,
          created_at: u.created_at,
          full_name: prof.full_name || '',
          username: prof.username || '',
          avatar_url: prof.avatar_url || '',
          follower_count: prof.follower_count || 0,
          following_count: prof.following_count || 0,
          post_count: prof.post_count || 0,
        };
      });

      if (status) users = users.filter(u => u.status === status);
      if (role) users = users.filter(u => u.role === role);
      if (search) {
        const s = search.toLowerCase();
        users = users.filter(u => u.username.toLowerCase().includes(s) || u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
      }

      return users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  static async updateUserStatus(targetUserId, newStatus, currentAdminId) {
    // Protection: Admin cannot suspend or ban themselves
    if (targetUserId === currentAdminId && (newStatus === 'suspended' || newStatus === 'banned')) {
      const err = new Error('No puedes suspender ni bloquear tu propia cuenta de administrador.');
      err.statusCode = 400;
      throw err;
    }

    const isConnected = await checkPgConnection();
    if (isConnected) {
      return await withTransaction(async (client) => {
        const targetRes = await client.query('SELECT role, status FROM users WHERE id = $1 FOR UPDATE', [targetUserId]);
        if (targetRes.rows.length === 0) {
          const err = new Error('Usuario no encontrado.');
          err.statusCode = 404;
          throw err;
        }

        const targetUser = targetRes.rows[0];

        // Protection: Ensure at least one active admin remains in the system
        if (targetUser.role === 'admin' && (newStatus === 'suspended' || newStatus === 'banned')) {
          const adminCountRes = await client.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'admin' AND status = 'active' AND id != $1", [targetUserId]);
          if (adminCountRes.rows[0].count === 0) {
            const err = new Error('No se puede desactivar al único administrador activo del sistema.');
            err.statusCode = 400;
            throw err;
          }
        }

        await client.query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, targetUserId]);
        return { success: true, message: `Estado de usuario actualizado a ${newStatus}.` };
      });
    } else {
      await memoryStore.init();
      const user = memoryStore.tables.users.find(u => u.id === targetUserId);
      if (!user) {
        const err = new Error('Usuario no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      if (user.role === 'admin' && (newStatus === 'suspended' || newStatus === 'banned')) {
        const otherActiveAdmins = memoryStore.tables.users.filter(u => u.role === 'admin' && u.status === 'active' && u.id !== targetUserId);
        if (otherActiveAdmins.length === 0) {
          const err = new Error('No se puede desactivar al único administrador activo del sistema.');
          err.statusCode = 400;
          throw err;
        }
      }

      user.status = newStatus;
      return { success: true, message: `Estado de usuario actualizado a ${newStatus}.` };
    }
  }

  static async listReports({ status = 'pending' } = {}) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT r.*,
          json_build_object('id', u.id, 'full_name', p.full_name, 'username', p.username) as reporter
        FROM reports r
        JOIN users u ON u.id = r.reporter_id
        JOIN user_profiles p ON p.user_id = r.reporter_id
        WHERE ($1::text IS NULL OR r.status = $1)
        ORDER BY r.created_at DESC`,
        [status === 'all' ? null : status]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      let reports = memoryStore.tables.reports;
      if (status !== 'all') {
        reports = reports.filter(r => r.status === status);
      }
      return reports
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(r => ({
          ...r,
          reporter: memoryStore.getPopulatedUser(r.reporter_id),
        }));
    }
  }

  static async resolveReport(reportId, { action, notes = '' }, currentAdminId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      return await withTransaction(async (client) => {
        const reportRes = await client.query('SELECT * FROM reports WHERE id = $1 FOR UPDATE', [reportId]);
        if (reportRes.rows.length === 0) {
          const err = new Error('Reporte no encontrado.');
          err.statusCode = 404;
          throw err;
        }

        const report = reportRes.rows[0];

        if (action === 'delete_content') {
          if (report.target_type === 'post') {
            await PostService.deletePost(report.target_id, currentAdminId, true);
          } else if (report.target_type === 'comment') {
            await CommentService.deleteComment(report.target_id, currentAdminId, true);
          }
        } else if (action === 'suspend_user' && report.target_type === 'user') {
          await this.updateUserStatus(report.target_id, 'suspended', currentAdminId);
        }

        await client.query(
          `UPDATE reports
           SET status = 'resolved', action_taken = $1, resolved_by = $2, resolved_at = NOW()
           WHERE id = $3`,
          [action, currentAdminId, reportId]
        );

        return { success: true, message: 'Reporte resuelto con éxito.' };
      });
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
          await PostService.deletePost(report.target_id, currentAdminId, true);
        } else if (report.target_type === 'comment') {
          await CommentService.deleteComment(report.target_id, currentAdminId, true);
        }
      } else if (action === 'suspend_user' && report.target_type === 'user') {
        await this.updateUserStatus(report.target_id, 'suspended', currentAdminId);
      }

      report.status = 'resolved';
      report.action_taken = action;
      report.resolved_by = currentAdminId;
      report.resolved_at = new Date().toISOString();

      return { success: true, message: 'Reporte resuelto con éxito.' };
    }
  }
}
