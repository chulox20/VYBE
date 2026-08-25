import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId, extractMentions } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class CommentService {
  static async createComment(postId, userId, { content, parent_comment_id = null }) {
    const isConnected = await checkPgConnection();
    const commentId = generateId('cmt');
    const now = new Date().toISOString();

    if (isConnected) {
      const postCheck = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      await pool.query(
        `INSERT INTO comments (id, post_id, user_id, parent_comment_id, content) VALUES ($1, $2, $3, $4, $5)`,
        [commentId, postId, userId, parent_comment_id, content]
      );
      await pool.query(`UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`, [postId]);

      // Notify post author
      if (postCheck.rows[0].user_id !== userId) {
        await NotificationService.createNotification({
          userId: postCheck.rows[0].user_id,
          actorId: userId,
          type: 'comment',
          postId,
          message: `comentó en tu publicación: "${content.slice(0, 50)}..."`,
        });
      }

      // If parent comment, notify parent author
      if (parent_comment_id) {
        const parentCheck = await pool.query('SELECT user_id FROM comments WHERE id = $1', [parent_comment_id]);
        if (parentCheck.rows.length > 0 && parentCheck.rows[0].user_id !== userId && parentCheck.rows[0].user_id !== postCheck.rows[0].user_id) {
          await NotificationService.createNotification({
            userId: parentCheck.rows[0].user_id,
            actorId: userId,
            type: 'comment',
            postId,
            message: `respondió a tu comentario: "${content.slice(0, 50)}..."`,
          });
        }
      }

      const res = await pool.query(
        `SELECT c.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as author
        FROM comments c
        JOIN users u ON u.id = c.user_id
        JOIN user_profiles prof ON prof.user_id = c.user_id
        WHERE c.id = $1`,
        [commentId]
      );

      return res.rows[0];
    } else {
      await memoryStore.init();
      const post = memoryStore.tables.posts.find(p => p.id === postId);
      if (!post) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const newComment = {
        id: commentId,
        post_id: postId,
        user_id: userId,
        parent_comment_id: parent_comment_id || null,
        content,
        like_count: 0,
        created_at: now,
        updated_at: now,
      };

      memoryStore.tables.comments.push(newComment);
      post.comment_count = (post.comment_count || 0) + 1;

      // Notify post author
      if (post.user_id !== userId) {
        await NotificationService.createNotification({
          userId: post.user_id,
          actorId: userId,
          type: 'comment',
          postId,
          message: `comentó en tu publicación: "${content.slice(0, 50)}..."`,
        });
      }

      // Notify parent author
      if (parent_comment_id) {
        const parentComment = memoryStore.tables.comments.find(c => c.id === parent_comment_id);
        if (parentComment && parentComment.user_id !== userId && parentComment.user_id !== post.user_id) {
          await NotificationService.createNotification({
            userId: parentComment.user_id,
            actorId: userId,
            type: 'comment',
            postId,
            message: `respondió a tu comentario: "${content.slice(0, 50)}..."`,
          });
        }
      }

      const author = memoryStore.getPopulatedUser(userId);
      return {
        ...newComment,
        author: {
          id: author.id,
          full_name: author.full_name,
          username: author.username,
          avatar_url: author.avatar_url,
        },
      };
    }
  }

  static async getCommentsByPost(postId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT c.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as author
        FROM comments c
        JOIN users u ON u.id = c.user_id
        JOIN user_profiles prof ON prof.user_id = c.user_id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC`,
        [postId]
      );

      const all = result.rows;
      return this.buildCommentTree(all);
    } else {
      await memoryStore.init();
      const rawComments = memoryStore.tables.comments
        .filter(c => c.post_id === postId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const populated = rawComments.map(c => {
        const author = memoryStore.getPopulatedUser(c.user_id);
        return {
          ...c,
          author: {
            id: author.id,
            full_name: author.full_name,
            username: author.username,
            avatar_url: author.avatar_url,
          },
        };
      });

      return this.buildCommentTree(populated);
    }
  }

  static buildCommentTree(comments) {
    const map = new Map();
    const roots = [];

    for (const c of comments) {
      map.set(c.id, { ...c, replies: [] });
    }

    for (const c of comments) {
      const node = map.get(c.id);
      if (c.parent_comment_id && map.has(c.parent_comment_id)) {
        map.get(c.parent_comment_id).replies.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  static async deleteComment(commentId, userId, isAdmin = false) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const check = await pool.query('SELECT post_id, user_id FROM comments WHERE id = $1', [commentId]);
      if (check.rows.length === 0) {
        const err = new Error('Comentario no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      if (check.rows[0].user_id !== userId && !isAdmin) {
        const err = new Error('No tienes permiso para eliminar este comentario.');
        err.statusCode = 403;
        throw err;
      }

      await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
      await pool.query('UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1', [check.rows[0].post_id]);
      return { success: true, message: 'Comentario eliminado correctamente.' };
    } else {
      await memoryStore.init();
      const idx = memoryStore.tables.comments.findIndex(c => c.id === commentId);
      if (idx === -1) {
        const err = new Error('Comentario no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      const comment = memoryStore.tables.comments[idx];
      if (comment.user_id !== userId && !isAdmin) {
        const err = new Error('No tienes permiso para eliminar este comentario.');
        err.statusCode = 403;
        throw err;
      }

      memoryStore.tables.comments.splice(idx, 1);
      const post = memoryStore.tables.posts.find(p => p.id === comment.post_id);
      if (post) post.comment_count = Math.max(0, (post.comment_count || 0) - 1);

      return { success: true, message: 'Comentario eliminado correctamente.' };
    }
  }
}
