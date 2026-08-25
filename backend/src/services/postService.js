import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId, extractHashtags, extractMentions } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class PostService {
  static async createPost(userId, { content, image_url = null, visibility = 'public', community_id = null }) {
    const isConnected = await checkPgConnection();
    const postId = generateId('pst');
    const now = new Date().toISOString();

    if (isConnected) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO posts (id, user_id, content, image_url, visibility) VALUES ($1, $2, $3, $4, $5)`,
          [postId, userId, content, image_url, visibility]
        );
        await client.query(`UPDATE user_profiles SET post_count = post_count + 1 WHERE user_id = $1`, [userId]);

        if (community_id) {
          await client.query(
            `INSERT INTO community_posts (id, community_id, post_id) VALUES ($1, $2, $3)`,
            [generateId('cp'), community_id, postId]
          );
          await client.query(`UPDATE communities SET post_count = post_count + 1 WHERE id = $1`, [community_id]);
        }

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      // Check mentions
      const mentions = extractMentions(content);
      for (const m of mentions) {
        const targetRes = await pool.query('SELECT user_id FROM user_profiles WHERE LOWER(username) = $1', [m.toLowerCase()]);
        if (targetRes.rows.length > 0 && targetRes.rows[0].user_id !== userId) {
          await NotificationService.createNotification({
            userId: targetRes.rows[0].user_id,
            actorId: userId,
            type: 'mention',
            postId,
            message: `te mencionó en una publicación: "${content.slice(0, 50)}..."`,
          });
        }
      }

      return this.getPostById(postId, userId);
    } else {
      await memoryStore.init();
      memoryStore.tables.posts.unshift({
        id: postId,
        user_id: userId,
        content,
        image_url,
        visibility,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        bookmark_count: 0,
        created_at: now,
        updated_at: now,
      });

      const profile = memoryStore.tables.user_profiles.find(p => p.user_id === userId);
      if (profile) profile.post_count = (profile.post_count || 0) + 1;

      if (community_id) {
        memoryStore.tables.community_posts.push({
          id: generateId('cp'),
          community_id,
          post_id: postId,
          created_at: now,
        });
        const comm = memoryStore.tables.communities.find(c => c.id === community_id);
        if (comm) comm.post_count = (comm.post_count || 0) + 1;
      }

      // Mentions in memory
      const mentions = extractMentions(content);
      for (const m of mentions) {
        const targetProfile = memoryStore.tables.user_profiles.find(p => p.username.toLowerCase() === m.toLowerCase());
        if (targetProfile && targetProfile.user_id !== userId) {
          await NotificationService.createNotification({
            userId: targetProfile.user_id,
            actorId: userId,
            type: 'mention',
            postId,
            message: `te mencionó en una publicación: "${content.slice(0, 50)}..."`,
          });
        }
      }

      return memoryStore.getPopulatedPost(postId, userId);
    }
  }

  static async getFeed(currentUserId = null, { limit = 20, cursor = null, tab = 'for_you' } = {}) {
    const isConnected = await checkPgConnection();
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    if (isConnected) {
      let queryText = `
        SELECT p.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'role', u.role
          ) as author,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked,
          EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as is_saved,
          (
            SELECT json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'image_url', c.image_url)
            FROM community_posts cp
            JOIN communities c ON c.id = cp.community_id
            WHERE cp.post_id = p.id
            LIMIT 1
          ) as community
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN user_profiles prof ON prof.user_id = p.user_id
        WHERE u.status = 'active'
      `;

      const params = [currentUserId];
      let paramIdx = 2;

      if (tab === 'following' && currentUserId) {
        queryText += ` AND p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)`;
      }

      if (cursor) {
        queryText += ` AND p.created_at < $${paramIdx++}`;
        params.push(cursor);
      }

      if (tab === 'popular') {
        queryText += ` ORDER BY (p.like_count * 2 + p.comment_count * 3) DESC, p.created_at DESC`;
      } else {
        queryText += ` ORDER BY p.created_at DESC`;
      }

      queryText += ` LIMIT $${paramIdx}`;
      params.push(parsedLimit + 1);

      const result = await pool.query(queryText, params);
      const hasMore = result.rows.length > parsedLimit;
      const posts = hasMore ? result.rows.slice(0, parsedLimit) : result.rows;
      const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;

      return { posts, nextCursor, hasMore };
    } else {
      await memoryStore.init();
      let allPosts = [...memoryStore.tables.posts];

      if (tab === 'following' && currentUserId) {
        const followingIds = memoryStore.tables.follows
          .filter(f => f.follower_id === currentUserId)
          .map(f => f.following_id);
        allPosts = allPosts.filter(p => followingIds.includes(p.user_id));
      }

      if (tab === 'popular') {
        allPosts.sort((a, b) => ((b.like_count || 0) * 2 + (b.comment_count || 0) * 3) - ((a.like_count || 0) * 2 + (a.comment_count || 0) * 3));
      } else {
        allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      if (cursor) {
        const cursorTime = new Date(cursor).getTime();
        allPosts = allPosts.filter(p => new Date(p.created_at).getTime() < cursorTime);
      }

      const hasMore = allPosts.length > parsedLimit;
      const sliced = hasMore ? allPosts.slice(0, parsedLimit) : allPosts;
      const posts = sliced.map(p => memoryStore.getPopulatedPost(p.id, currentUserId)).filter(Boolean);
      const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;

      return { posts, nextCursor, hasMore };
    }
  }

  static async getPostById(postId, currentUserId = null) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT p.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'role', u.role
          ) as author,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked,
          EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as is_saved,
          (
            SELECT json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'image_url', c.image_url)
            FROM community_posts cp
            JOIN communities c ON c.id = cp.community_id
            WHERE cp.post_id = p.id
            LIMIT 1
          ) as community
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN user_profiles prof ON prof.user_id = p.user_id
        WHERE p.id = $2`,
        [currentUserId, postId]
      );

      if (result.rows.length === 0) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }
      return result.rows[0];
    } else {
      await memoryStore.init();
      const post = memoryStore.getPopulatedPost(postId, currentUserId);
      if (!post) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }
      return post;
    }
  }

  static async deletePost(postId, userId, isAdmin = false) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const check = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
      if (check.rows.length === 0) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      if (check.rows[0].user_id !== userId && !isAdmin) {
        const err = new Error('No tienes permiso para eliminar esta publicación.');
        err.statusCode = 403;
        throw err;
      }

      await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
      await pool.query('UPDATE user_profiles SET post_count = GREATEST(0, post_count - 1) WHERE user_id = $1', [check.rows[0].user_id]);
      return { success: true, message: 'Publicación eliminada correctamente.' };
    } else {
      await memoryStore.init();
      const idx = memoryStore.tables.posts.findIndex(p => p.id === postId);
      if (idx === -1) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const post = memoryStore.tables.posts[idx];
      if (post.user_id !== userId && !isAdmin) {
        const err = new Error('No tienes permiso para eliminar esta publicación.');
        err.statusCode = 403;
        throw err;
      }

      memoryStore.tables.posts.splice(idx, 1);
      const profile = memoryStore.tables.user_profiles.find(p => p.user_id === post.user_id);
      if (profile) profile.post_count = Math.max(0, (profile.post_count || 0) - 1);

      return { success: true, message: 'Publicación eliminada correctamente.' };
    }
  }

  static async toggleLike(postId, userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const postCheck = await pool.query('SELECT user_id, like_count FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const existingLike = await pool.query('SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      let isLiked = false;

      if (existingLike.rows.length > 0) {
        await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
        await pool.query('UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1', [postId]);
        isLiked = false;
      } else {
        await pool.query('INSERT INTO post_likes (id, user_id, post_id) VALUES ($1, $2, $3)', [generateId('pl'), userId, postId]);
        await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [postId]);
        isLiked = true;

        if (postCheck.rows[0].user_id !== userId) {
          await NotificationService.createNotification({
            userId: postCheck.rows[0].user_id,
            actorId: userId,
            type: 'like',
            postId,
            message: 'le dio like a tu publicación',
          });
        }
      }

      const updated = await pool.query('SELECT like_count FROM posts WHERE id = $1', [postId]);
      return { is_liked: isLiked, like_count: updated.rows[0].like_count };
    } else {
      await memoryStore.init();
      const post = memoryStore.tables.posts.find(p => p.id === postId);
      if (!post) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const likeIdx = memoryStore.tables.post_likes.findIndex(l => l.user_id === userId && l.post_id === postId);
      let isLiked = false;

      if (likeIdx !== -1) {
        memoryStore.tables.post_likes.splice(likeIdx, 1);
        post.like_count = Math.max(0, (post.like_count || 0) - 1);
        isLiked = false;
      } else {
        memoryStore.tables.post_likes.push({
          id: generateId('pl'),
          user_id: userId,
          post_id: postId,
          created_at: new Date().toISOString(),
        });
        post.like_count = (post.like_count || 0) + 1;
        isLiked = true;

        if (post.user_id !== userId) {
          await NotificationService.createNotification({
            userId: post.user_id,
            actorId: userId,
            type: 'like',
            postId,
            message: 'le dio like a tu publicación',
          });
        }
      }

      return { is_liked: isLiked, like_count: post.like_count };
    }
  }

  static async toggleSave(postId, userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const existingSave = await pool.query('SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      let isSaved = false;

      if (existingSave.rows.length > 0) {
        await pool.query('DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, postId]);
        await pool.query('UPDATE posts SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = $1', [postId]);
        isSaved = false;
      } else {
        await pool.query('INSERT INTO saved_posts (id, user_id, post_id) VALUES ($1, $2, $3)', [generateId('sp'), userId, postId]);
        await pool.query('UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = $1', [postId]);
        isSaved = true;
      }

      return { is_saved: isSaved };
    } else {
      await memoryStore.init();
      const post = memoryStore.tables.posts.find(p => p.id === postId);
      if (!post) {
        const err = new Error('Publicación no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const saveIdx = memoryStore.tables.saved_posts.findIndex(s => s.user_id === userId && s.post_id === postId);
      let isSaved = false;

      if (saveIdx !== -1) {
        memoryStore.tables.saved_posts.splice(saveIdx, 1);
        post.bookmark_count = Math.max(0, (post.bookmark_count || 0) - 1);
        isSaved = false;
      } else {
        memoryStore.tables.saved_posts.push({
          id: generateId('sp'),
          user_id: userId,
          post_id: postId,
          created_at: new Date().toISOString(),
        });
        post.bookmark_count = (post.bookmark_count || 0) + 1;
        isSaved = true;
      }

      return { is_saved: isSaved };
    }
  }

  static async getSavedPosts(userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT p.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'role', u.role
          ) as author,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked,
          TRUE as is_saved
        FROM saved_posts sp
        JOIN posts p ON p.id = sp.post_id
        JOIN users u ON u.id = p.user_id
        JOIN user_profiles prof ON prof.user_id = p.user_id
        WHERE sp.user_id = $1
        ORDER BY sp.created_at DESC`,
        [userId]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const savedPostIds = memoryStore.tables.saved_posts
        .filter(s => s.user_id === userId)
        .map(s => s.post_id);

      return savedPostIds
        .map(id => memoryStore.getPopulatedPost(id, userId))
        .filter(Boolean);
    }
  }
}
