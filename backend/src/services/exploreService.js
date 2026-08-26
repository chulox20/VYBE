import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { extractHashtags } from '../utils/helpers.js';

export class ExploreService {
  static async getTrendingHashtags() {
    const isConnected = await checkPgConnection();

    if (isConnected) {
      const result = await pool.query(
        `SELECT content FROM posts WHERE created_at > NOW() - INTERVAL '7 days'`
      );

      const tagCounts = new Map();
      for (const row of result.rows) {
        const tags = extractHashtags(row.content);
        for (const t of tags) {
          const lower = t.toLowerCase();
          tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
        }
      }

      const trends = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({
          tag,
          count,
          category: 'Tendencia',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return trends;
    } else {
      await memoryStore.init();
      const tagCounts = new Map();

      for (const p of memoryStore.tables.posts) {
        const tags = extractHashtags(p.content);
        for (const t of tags) {
          const lower = t.toLowerCase();
          tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
        }
      }

      const trends = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({
          tag,
          count,
          category: 'Tendencia',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return trends;
    }
  }

  static async getPopularPosts(currentUserId = null, limit = 10) {
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
        WHERE u.status = 'active'
        ORDER BY (p.like_count * 2 + p.comment_count * 3 + p.bookmark_count) DESC, p.created_at DESC
        LIMIT $2`,
        [currentUserId, limit]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      return memoryStore.tables.posts
        .slice()
        .sort((a, b) => ((b.like_count || 0) * 2 + (b.comment_count || 0) * 3) - ((a.like_count || 0) * 2 + (a.comment_count || 0) * 3))
        .slice(0, limit)
        .map(p => memoryStore.getPopulatedPost(p.id, currentUserId))
        .filter(Boolean);
    }
  }

  static async searchAll(q, currentUserId = null) {
    return this.search({ q, currentUserId });
  }

  static async search({ q, currentUserId = null }) {
    if (!q || !q.trim()) {
      return { users: [], posts: [], communities: [] };
    }

    const term = q.trim();
    const isConnected = await checkPgConnection();

    if (isConnected) {
      const isTag = term.startsWith('#');
      const cleanTerm = isTag ? term.slice(1) : term;

      // 1. Search Users
      const usersRes = await pool.query(
        `SELECT u.id, p.full_name, p.username, p.avatar_url, p.bio, p.follower_count,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
        FROM user_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE u.status = 'active'
          AND (LOWER(p.username) LIKE LOWER($2) OR LOWER(p.full_name) LIKE LOWER($2))
        LIMIT 10`,
        [currentUserId, `%${cleanTerm}%`]
      );

      // 2. Search Posts
      const postsRes = await pool.query(
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
        WHERE u.status = 'active'
          AND LOWER(p.content) LIKE LOWER($2)
        ORDER BY p.created_at DESC
        LIMIT 20`,
        [currentUserId, `%${term}%`]
      );

      // 3. Search Communities
      const commRes = await pool.query(
        `SELECT c.*,
          json_build_object('id', u.id, 'full_name', p.full_name, 'username', p.username, 'avatar_url', p.avatar_url) as owner,
          EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        JOIN user_profiles p ON p.user_id = c.owner_id
        WHERE LOWER(c.name) LIKE LOWER($2) OR LOWER(c.description) LIKE LOWER($2)
        LIMIT 10`,
        [currentUserId, `%${cleanTerm}%`]
      );

      return {
        users: usersRes.rows,
        posts: postsRes.rows,
        communities: commRes.rows,
      };
    } else {
      await memoryStore.init();
      const lower = term.toLowerCase();
      const cleanTerm = lower.startsWith('#') ? lower.slice(1) : lower;

      const users = memoryStore.tables.user_profiles
        .filter(p => p.username.toLowerCase().includes(cleanTerm) || p.full_name.toLowerCase().includes(cleanTerm))
        .map(p => {
          const user = memoryStore.tables.users.find(u => u.id === p.user_id);
          const isFollowing = currentUserId
            ? memoryStore.tables.follows.some(f => f.follower_id === currentUserId && f.following_id === user.id)
            : false;
          return {
            id: user.id,
            full_name: p.full_name,
            username: p.username,
            avatar_url: p.avatar_url,
            bio: p.bio,
            follower_count: p.follower_count || 0,
            is_following: isFollowing,
          };
        })
        .slice(0, 10);

      const posts = memoryStore.tables.posts
        .filter(p => p.content.toLowerCase().includes(lower))
        .map(p => memoryStore.getPopulatedPost(p.id, currentUserId))
        .filter(Boolean)
        .slice(0, 20);

      const communities = memoryStore.tables.communities
        .filter(c => c.name.toLowerCase().includes(cleanTerm) || c.description?.toLowerCase().includes(cleanTerm))
        .map(c => {
          const populated = memoryStore.getPopulatedCommunity(c.id);
          const isMember = currentUserId
            ? memoryStore.tables.community_members.some(m => m.community_id === c.id && m.user_id === currentUserId)
            : false;
          return { ...populated, is_member: isMember };
        })
        .slice(0, 10);

      return { users, posts, communities };
    }
  }
}
