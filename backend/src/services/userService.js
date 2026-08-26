import { pool, checkPgConnection, withTransaction } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class UserService {
  static async getProfileByUsername(username, currentUserId = null) {
    const isConnected = await checkPgConnection();
    const cleanUsername = username.toLowerCase().trim();

    if (isConnected) {
      const result = await pool.query(
        `SELECT u.id, u.email, u.role, u.status, u.created_at as member_since,
          p.full_name, p.username, p.bio, p.avatar_url, p.cover_url, p.website, p.location,
          p.follower_count, p.following_count, p.post_count,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
        FROM user_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE LOWER(p.username) = $2`,
        [currentUserId, cleanUsername]
      );

      if (result.rows.length === 0) {
        const err = new Error('Perfil de usuario no encontrado.');
        err.statusCode = 404;
        throw err;
      }
      return result.rows[0];
    } else {
      await memoryStore.init();
      const profile = memoryStore.tables.user_profiles.find(p => p.username.toLowerCase() === cleanUsername);
      if (!profile) {
        const err = new Error('Perfil de usuario no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      const user = memoryStore.tables.users.find(u => u.id === profile.user_id);
      const isFollowing = currentUserId
        ? memoryStore.tables.follows.some(f => f.follower_id === currentUserId && f.following_id === user.id)
        : false;

      return {
        ...profile,
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        member_since: user.created_at,
        is_following: isFollowing,
      };
    }
  }

  static async toggleFollow(followerId, targetUsername) {
    const isConnected = await checkPgConnection();
    const cleanUsername = targetUsername.toLowerCase().trim();

    if (isConnected) {
      const targetRes = await pool.query('SELECT user_id FROM user_profiles WHERE LOWER(username) = $1', [cleanUsername]);
      if (targetRes.rows.length === 0) {
        const err = new Error('Usuario a seguir no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      const targetId = targetRes.rows[0].user_id;
      if (followerId === targetId) {
        const err = new Error('No puedes seguirte a ti mismo.');
        err.statusCode = 400;
        throw err;
      }

      // Execute ACID Transaction for follow insertion/deletion and counter updates
      const result = await withTransaction(async (client) => {
        const existingFollow = await client.query(
          'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2 FOR UPDATE',
          [followerId, targetId]
        );

        let isFollowing = false;

        if (existingFollow.rows.length > 0) {
          await client.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, targetId]);
          await client.query(
            'UPDATE user_profiles SET follower_count = (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) WHERE user_id = $1',
            [targetId]
          );
          await client.query(
            'UPDATE user_profiles SET following_count = (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) WHERE user_id = $1',
            [followerId]
          );
          isFollowing = false;
        } else {
          await client.query(
            'INSERT INTO follows (id, follower_id, following_id) VALUES ($1, $2, $3)',
            [generateId('flw'), followerId, targetId]
          );
          await client.query(
            'UPDATE user_profiles SET follower_count = (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) WHERE user_id = $1',
            [targetId]
          );
          await client.query(
            'UPDATE user_profiles SET following_count = (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) WHERE user_id = $1',
            [followerId]
          );
          isFollowing = true;
        }

        const countRes = await client.query('SELECT follower_count FROM user_profiles WHERE user_id = $1', [targetId]);
        return { isFollowing, followerCount: countRes.rows[0].follower_count, targetId };
      });

      // Notification is dispatched after successful transaction commit
      if (result.isFollowing) {
        await NotificationService.createNotification({
          userId: result.targetId,
          actorId: followerId,
          type: 'follow',
          postId: null,
          message: 'comenzó a seguirte',
        });
      }

      return { is_following: result.isFollowing, follower_count: result.followerCount };
    } else {
      await memoryStore.init();
      const targetProfile = memoryStore.tables.user_profiles.find(p => p.username.toLowerCase() === cleanUsername);
      if (!targetProfile) {
        const err = new Error('Usuario a seguir no encontrado.');
        err.statusCode = 404;
        throw err;
      }

      const targetId = targetProfile.user_id;
      if (followerId === targetId) {
        const err = new Error('No puedes seguirte a ti mismo.');
        err.statusCode = 400;
        throw err;
      }

      const followerProfile = memoryStore.tables.user_profiles.find(p => p.user_id === followerId);
      const followIdx = memoryStore.tables.follows.findIndex(f => f.follower_id === followerId && f.following_id === targetId);
      let isFollowing = false;

      if (followIdx !== -1) {
        memoryStore.tables.follows.splice(followIdx, 1);
        isFollowing = false;
      } else {
        memoryStore.tables.follows.push({
          id: generateId('flw'),
          follower_id: followerId,
          following_id: targetId,
          created_at: new Date().toISOString(),
        });
        isFollowing = true;
      }

      // Recalculate derived counters atomically
      targetProfile.follower_count = memoryStore.tables.follows.filter(f => f.following_id === targetId).length;
      if (followerProfile) {
        followerProfile.following_count = memoryStore.tables.follows.filter(f => f.follower_id === followerId).length;
      }

      if (isFollowing) {
        await NotificationService.createNotification({
          userId: targetId,
          actorId: followerId,
          type: 'follow',
          postId: null,
          message: 'comenzó a seguirte',
        });
      }

      return { is_following: isFollowing, follower_count: targetProfile.follower_count };
    }
  }

  static async getUserPosts(username, currentUserId = null) {
    const isConnected = await checkPgConnection();
    const cleanUsername = username.toLowerCase().trim();

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
          EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as is_saved
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN user_profiles prof ON prof.user_id = p.user_id
        WHERE LOWER(prof.username) = $2
        ORDER BY p.created_at DESC`,
        [currentUserId, cleanUsername]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const profile = memoryStore.tables.user_profiles.find(p => p.username.toLowerCase() === cleanUsername);
      if (!profile) return [];

      return memoryStore.tables.posts
        .filter(p => p.user_id === profile.user_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(p => memoryStore.getPopulatedPost(p.id, currentUserId))
        .filter(Boolean);
    }
  }

  static async getUserReplies(username) {
    const isConnected = await checkPgConnection();
    const cleanUsername = username.toLowerCase().trim();

    if (isConnected) {
      const result = await pool.query(
        `SELECT c.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as author,
          json_build_object(
            'id', p.id,
            'content', p.content,
            'created_at', p.created_at
          ) as post
        FROM comments c
        JOIN posts p ON p.id = c.post_id
        JOIN users u ON u.id = c.user_id
        JOIN user_profiles prof ON prof.user_id = c.user_id
        WHERE LOWER(prof.username) = $1
        ORDER BY c.created_at DESC`,
        [cleanUsername]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const profile = memoryStore.tables.user_profiles.find(p => p.username.toLowerCase() === cleanUsername);
      if (!profile) return [];

      return memoryStore.tables.comments
        .filter(c => c.user_id === profile.user_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(c => {
          const author = memoryStore.getPopulatedUser(c.user_id);
          const post = memoryStore.tables.posts.find(p => p.id === c.post_id);
          return {
            ...c,
            author,
            post: post ? { id: post.id, content: post.content, created_at: post.created_at } : null,
          };
        });
    }
  }

  static async getSuggestedUsers(currentUserId = null, limit = 5) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT u.id, p.full_name, p.username, p.avatar_url, p.bio, p.follower_count,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
        FROM user_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE u.id != COALESCE($1, '')
          AND u.status = 'active'
          AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = COALESCE($1, ''))
        ORDER BY p.follower_count DESC, u.created_at DESC
        LIMIT $2`,
        [currentUserId, limit]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const followingIds = currentUserId
        ? memoryStore.tables.follows.filter(f => f.follower_id === currentUserId).map(f => f.following_id)
        : [];

      return memoryStore.tables.user_profiles
        .filter(p => p.user_id !== currentUserId && !followingIds.includes(p.user_id))
        .map(p => {
          const user = memoryStore.tables.users.find(u => u.id === p.user_id);
          if (!user || user.status !== 'active') return null;
          return {
            id: user.id,
            full_name: p.full_name,
            username: p.username,
            avatar_url: p.avatar_url,
            bio: p.bio,
            follower_count: p.follower_count || 0,
            is_following: false,
          };
        })
        .filter(Boolean)
        .slice(0, limit);
    }
  }
}
