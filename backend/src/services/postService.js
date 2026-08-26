import { pool, checkPgConnection, withTransaction } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId, extractHashtags, extractMentions } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class PostService {
  static async createPost(userId, { content, image_url = null, visibility = 'public', community_id = null }) {
    const isConnected = await checkPgConnection();
    const postId = generateId('pst');
    const now = new Date().toISOString();

    if (isConnected) {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO posts (id, user_id, content, image_url, visibility) VALUES ($1, $2, $3, $4, $5)`,
          [postId, userId, content, image_url, visibility]
        );
        await client.query(
          `UPDATE user_profiles SET post_count = (SELECT COUNT(*)::int FROM posts WHERE user_id = $1) WHERE user_id = $1`,
          [userId]
        );

        if (community_id) {
          await client.query(
            `INSERT INTO community_posts (id, community_id, post_id) VALUES ($1, $2, $3)`,
            [generateId('cp'), community_id, postId]
          );
          await client.query(
            `UPDATE communities SET post_count = (SELECT COUNT(*)::int FROM community_posts WHERE community_id = $1) WHERE id = $1`,
            [community_id]
          );
        }
      });

      // Mentions notification after transaction commit
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
      if (profile) {
        profile.post_count = memoryStore.tables.posts.filter(p => p.user_id === userId).length;
      }

      if (community_id) {
        memoryStore.tables.community_posts.push({
          id: generateId('cp'),
          community_id,
          post_id: postId,
          created_at: now,
        });
        const comm = memoryStore.tables.communities.find(c => c.id === community_id);
        if (comm) {
          comm.post_count = memoryStore.tables.community_posts.filter(cp => cp.community_id === community_id).length;
        }
      }

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
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

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
      return await withTransaction(async (client) => {
        const check = await client.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
        if (check.rows.length === 0) {
          const err = new Error('Publicación no encontrada.');
          err.statusCode = 404;
          throw err;
        }

        const authorId = check.rows[0].user_id;
        if (authorId !== userId && !isAdmin) {
          const err = new Error('No tienes permiso para eliminar esta publicación.');
          err.statusCode = 403;
          throw err;
        }

        // Get linked communities before deletion
        const commPosts = await client.query('SELECT community_id FROM community_posts WHERE post_id = $1', [postId]);

        // Delete post
        await client.query('DELETE FROM posts WHERE id = $1', [postId]);

        // Recalculate user post count
        await client.query(
          'UPDATE user_profiles SET post_count = (SELECT COUNT(*)::int FROM posts WHERE user_id = $1) WHERE user_id = $1',
          [authorId]
        );

        // Recalculate community post count if post belonged to communities
        for (const row of commPosts.rows) {
          await client.query(
            'UPDATE communities SET post_count = (SELECT COUNT(*)::int FROM community_posts WHERE community_id = $1) WHERE id = $1',
            [row.community_id]
          );
        }

        return { success: true, message: 'Publicación eliminada correctamente.' };
      });
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

      // Check community links
      const commPostIdxs = [];
      const affectedCommunityIds = [];
      memoryStore.tables.community_posts.forEach((cp, cpIdx) => {
        if (cp.post_id === postId) {
          commPostIdxs.push(cpIdx);
          affectedCommunityIds.push(cp.community_id);
        }
      });

      // Remove in reverse order
      for (let i = commPostIdxs.length - 1; i >= 0; i--) {
        memoryStore.tables.community_posts.splice(commPostIdxs[i], 1);
      }

      // Remove post
      memoryStore.tables.posts.splice(idx, 1);

      // Recalculate user post count
      const profile = memoryStore.tables.user_profiles.find(p => p.user_id === post.user_id);
      if (profile) {
        profile.post_count = memoryStore.tables.posts.filter(p => p.user_id === post.user_id).length;
      }

      // Recalculate community post count
      for (const commId of affectedCommunityIds) {
        const comm = memoryStore.tables.communities.find(c => c.id === commId);
        if (comm) {
          comm.post_count = memoryStore.tables.community_posts.filter(cp => cp.community_id === commId).length;
        }
      }

      return { success: true, message: 'Publicación eliminada correctamente.' };
    }
  }

  static async toggleLike(postId, userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await withTransaction(async (client) => {
        const postCheck = await client.query('SELECT user_id FROM posts WHERE id = $1 FOR UPDATE', [postId]);
        if (postCheck.rows.length === 0) {
          const err = new Error('Publicación no encontrada.');
          err.statusCode = 404;
          throw err;
        }

        const authorId = postCheck.rows[0].user_id;
        const existingLike = await client.query(
          'SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2',
          [userId, postId]
        );

        let isLiked = false;

        if (existingLike.rows.length > 0) {
          await client.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
          await client.query(
            'UPDATE posts SET like_count = (SELECT COUNT(*)::int FROM post_likes WHERE post_id = $1) WHERE id = $1',
            [postId]
          );
          isLiked = false;
        } else {
          await client.query(
            'INSERT INTO post_likes (id, user_id, post_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, post_id) DO NOTHING',
            [generateId('pl'), userId, postId]
          );
          await client.query(
            'UPDATE posts SET like_count = (SELECT COUNT(*)::int FROM post_likes WHERE post_id = $1) WHERE id = $1',
            [postId]
          );
          isLiked = true;
        }

        const countRes = await client.query('SELECT like_count FROM posts WHERE id = $1', [postId]);
        return { isLiked, likeCount: countRes.rows[0].like_count, authorId };
      });

      if (result.isLiked && result.authorId !== userId) {
        await NotificationService.createNotification({
          userId: result.authorId,
          actorId: userId,
          type: 'like',
          postId,
          message: 'le dio like a tu publicación',
        });
      }

      return { is_liked: result.isLiked, like_count: result.likeCount };
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
        isLiked = false;
      } else {
        memoryStore.tables.post_likes.push({
          id: generateId('pl'),
          user_id: userId,
          post_id: postId,
          created_at: new Date().toISOString(),
        });
        isLiked = true;
      }

      // Recalculate count accurately
      post.like_count = memoryStore.tables.post_likes.filter(l => l.post_id === postId).length;

      if (isLiked && post.user_id !== userId) {
        await NotificationService.createNotification({
          userId: post.user_id,
          actorId: userId,
          type: 'like',
          postId,
          message: 'le dio like a tu publicación',
        });
      }

      return { is_liked: isLiked, like_count: post.like_count };
    }
  }

  static async toggleSave(postId, userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      return await withTransaction(async (client) => {
        const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
        if (postCheck.rows.length === 0) {
          const err = new Error('Publicación no encontrada.');
          err.statusCode = 404;
          throw err;
        }

        const existingSave = await client.query(
          'SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2',
          [userId, postId]
        );
        let isSaved = false;

        if (existingSave.rows.length > 0) {
          await client.query('DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, postId]);
          await client.query(
            'UPDATE posts SET bookmark_count = (SELECT COUNT(*)::int FROM saved_posts WHERE post_id = $1) WHERE id = $1',
            [postId]
          );
          isSaved = false;
        } else {
          await client.query(
            'INSERT INTO saved_posts (id, user_id, post_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, post_id) DO NOTHING',
            [generateId('sp'), userId, postId]
          );
          await client.query(
            'UPDATE posts SET bookmark_count = (SELECT COUNT(*)::int FROM saved_posts WHERE post_id = $1) WHERE id = $1',
            [postId]
          );
          isSaved = true;
        }

        return { is_saved: isSaved };
      });
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
        isSaved = false;
      } else {
        memoryStore.tables.saved_posts.push({
          id: generateId('sp'),
          user_id: userId,
          post_id: postId,
          created_at: new Date().toISOString(),
        });
        isSaved = true;
      }

      post.bookmark_count = memoryStore.tables.saved_posts.filter(s => s.post_id === postId).length;
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
