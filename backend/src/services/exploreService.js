import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { extractHashtags } from '../utils/helpers.js';

export class ExploreService {
  static async getTrendingHashtags() {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query('SELECT content FROM posts ORDER BY created_at DESC LIMIT 200');
      const counts = {};

      for (const row of result.rows) {
        const tags = extractHashtags(row.content);
        for (const t of tags) {
          counts[t] = (counts[t] || 0) + 1;
        }
      }

      const defaultTrends = [
        { tag: 'React', count: 128, category: 'Tecnología' },
        { tag: 'Design', count: 94, category: 'Diseño' },
        { tag: 'AI', count: 86, category: 'Inteligencia Artificial' },
        { tag: 'WebDevelopment', count: 65, category: 'Desarrollo' },
        { tag: 'TailwindCSS', count: 47, category: 'Frontend' },
        { tag: 'OpenSource', count: 39, category: 'Comunidad' },
      ];

      for (const [tag, count] of Object.entries(counts)) {
        const existing = defaultTrends.find(dt => dt.tag.toLowerCase() === tag.toLowerCase());
        if (existing) {
          existing.count += count;
        } else {
          defaultTrends.push({ tag, count, category: 'Tendencia' });
        }
      }

      return defaultTrends.sort((a, b) => b.count - a.count).slice(0, 8);
    } else {
      await memoryStore.init();
      const counts = {};
      for (const post of memoryStore.tables.posts) {
        const tags = extractHashtags(post.content);
        for (const t of tags) {
          counts[t] = (counts[t] || 0) + 1;
        }
      }

      const defaultTrends = [
        { tag: 'React', count: 128, category: 'Tecnología' },
        { tag: 'Design', count: 94, category: 'Diseño' },
        { tag: 'AI', count: 86, category: 'Inteligencia Artificial' },
        { tag: 'WebDevelopment', count: 65, category: 'Desarrollo' },
        { tag: 'TailwindCSS', count: 47, category: 'Frontend' },
        { tag: 'OpenSource', count: 39, category: 'Comunidad' },
      ];

      for (const [tag, count] of Object.entries(counts)) {
        const existing = defaultTrends.find(dt => dt.tag.toLowerCase() === tag.toLowerCase());
        if (existing) {
          existing.count += count;
        } else {
          defaultTrends.push({ tag, count, category: 'Tendencia' });
        }
      }

      return defaultTrends.sort((a, b) => b.count - a.count).slice(0, 8);
    }
  }

  static async searchAll(query, currentUserId = null) {
    if (!query || typeof query !== 'string') {
      return { users: [], posts: [], communities: [] };
    }

    const cleanQuery = query.trim().replace(/^#|^@/, '');
    const isConnected = await checkPgConnection();

    if (isConnected) {
      // 1. Search Users
      const usersRes = await pool.query(
        `SELECT u.id, p.full_name, p.username, p.avatar_url, p.bio, p.follower_count,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
        FROM user_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE u.status = 'active'
          AND (p.username ILIKE $2 OR p.full_name ILIKE $2 OR p.bio ILIKE $2)
        ORDER BY p.follower_count DESC
        LIMIT 10`,
        [currentUserId, `%${cleanQuery}%`]
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
          EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as is_saved
        FROM posts p
        JOIN users u ON u.id = p.user_id
        JOIN user_profiles prof ON prof.user_id = p.user_id
        WHERE u.status = 'active'
          AND p.content ILIKE $2
        ORDER BY (p.like_count + p.comment_count) DESC, p.created_at DESC
        LIMIT 20`,
        [currentUserId, `%${cleanQuery}%`]
      );

      // 3. Search Communities
      const commsRes = await pool.query(
        `SELECT c.*,
          json_build_object('id', u.id, 'full_name', prof.full_name, 'username', prof.username) as owner
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        JOIN user_profiles prof ON prof.user_id = c.owner_id
        WHERE c.name ILIKE $1 OR c.description ILIKE $1 OR c.slug ILIKE $1
        ORDER BY c.member_count DESC
        LIMIT 10`,
        [`%${cleanQuery}%`]
      );

      return {
        users: usersRes.rows,
        posts: postsRes.rows,
        communities: commsRes.rows,
      };
    } else {
      await memoryStore.init();
      const q = cleanQuery.toLowerCase();

      // Users
      const users = memoryStore.tables.user_profiles
        .filter(p => p.username.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q) || (p.bio && p.bio.toLowerCase().includes(q)))
        .map(p => {
          const user = memoryStore.tables.users.find(u => u.id === p.user_id);
          if (!user || user.status !== 'active') return null;
          const isFollowing = currentUserId ? memoryStore.tables.follows.some(f => f.follower_id === currentUserId && f.following_id === user.id) : false;
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
        .filter(Boolean)
        .slice(0, 10);

      // Posts
      const posts = memoryStore.tables.posts
        .filter(p => p.content.toLowerCase().includes(q))
        .map(p => memoryStore.getPopulatedPost(p.id, currentUserId))
        .filter(Boolean)
        .slice(0, 20);

      // Communities
      const communities = memoryStore.tables.communities
        .filter(c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)) || c.slug.toLowerCase().includes(q))
        .map(c => {
          const owner = memoryStore.getPopulatedUser(c.owner_id);
          return {
            ...c,
            owner: { id: owner?.id, full_name: owner?.full_name, username: owner?.username },
          };
        })
        .slice(0, 10);

      return { users, posts, communities };
    }
  }
}
