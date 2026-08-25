import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId, slugify } from '../utils/helpers.js';

export class CommunityService {
  static async getCommunities({ category = null, search = null } = {}) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      let queryText = `
        SELECT c.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as owner
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        JOIN user_profiles prof ON prof.user_id = c.owner_id
        WHERE 1=1
      `;
      const params = [];
      let idx = 1;

      if (category && category !== 'Todos') {
        queryText += ` AND c.category ILIKE $${idx++}`;
        params.push(category);
      }

      if (search) {
        queryText += ` AND (c.name ILIKE $${idx} OR c.description ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }

      queryText += ` ORDER BY c.member_count DESC, c.created_at DESC`;
      const result = await pool.query(queryText, params);
      return result.rows;
    } else {
      await memoryStore.init();
      let list = [...memoryStore.tables.communities];

      if (category && category !== 'Todos') {
        list = list.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
      }

      return list.map(c => {
        const owner = memoryStore.getPopulatedUser(c.owner_id);
        return {
          ...c,
          owner: {
            id: owner?.id,
            full_name: owner?.full_name,
            username: owner?.username,
            avatar_url: owner?.avatar_url,
          },
        };
      });
    }
  }

  static async getCommunityBySlug(slug, currentUserId = null) {
    const isConnected = await checkPgConnection();
    const cleanSlug = slug.toLowerCase().trim();

    if (isConnected) {
      const result = await pool.query(
        `SELECT c.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as owner,
          EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member,
          (SELECT role FROM community_members WHERE community_id = c.id AND user_id = $1 LIMIT 1) as user_role
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        JOIN user_profiles prof ON prof.user_id = c.owner_id
        WHERE LOWER(c.slug) = $2`,
        [currentUserId, cleanSlug]
      );

      if (result.rows.length === 0) {
        const err = new Error('Comunidad no encontrada.');
        err.statusCode = 404;
        throw err;
      }
      return result.rows[0];
    } else {
      await memoryStore.init();
      const community = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!community) {
        const err = new Error('Comunidad no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const owner = memoryStore.getPopulatedUser(community.owner_id);
      const membership = currentUserId
        ? memoryStore.tables.community_members.find(cm => cm.community_id === community.id && cm.user_id === currentUserId)
        : null;

      return {
        ...community,
        owner: {
          id: owner?.id,
          full_name: owner?.full_name,
          username: owner?.username,
          avatar_url: owner?.avatar_url,
        },
        is_member: !!membership,
        user_role: membership ? membership.role : null,
      };
    }
  }

  static async createCommunity(userId, { name, slug, description = '', category = 'Tecnología', image_url = '', cover_url = '' }) {
    const isConnected = await checkPgConnection();
    const finalSlug = slug ? slugify(slug) : slugify(name);
    const commId = generateId('comm');
    const now = new Date().toISOString();

    const defaultImage = image_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80';
    const defaultCover = cover_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80';

    if (isConnected) {
      const slugCheck = await pool.query('SELECT id FROM communities WHERE slug = $1', [finalSlug]);
      if (slugCheck.rows.length > 0) {
        const err = new Error('Ya existe una comunidad con este nombre o enlace slug.');
        err.statusCode = 400;
        throw err;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO communities (id, owner_id, name, slug, description, category, image_url, cover_url, member_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
          [commId, userId, name.trim(), finalSlug, description.trim(), category, defaultImage, defaultCover]
        );
        await client.query(
          `INSERT INTO community_members (id, community_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
          [generateId('cm'), commId, userId]
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      return this.getCommunityBySlug(finalSlug, userId);
    } else {
      await memoryStore.init();
      const existing = memoryStore.tables.communities.find(c => c.slug === finalSlug);
      if (existing) {
        const err = new Error('Ya existe una comunidad con este nombre o enlace slug.');
        err.statusCode = 400;
        throw err;
      }

      const newComm = {
        id: commId,
        owner_id: userId,
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        category,
        image_url: defaultImage,
        cover_url: defaultCover,
        member_count: 1,
        post_count: 0,
        created_at: now,
        updated_at: now,
      };

      memoryStore.tables.communities.push(newComm);
      memoryStore.tables.community_members.push({
        id: generateId('cm'),
        community_id: commId,
        user_id: userId,
        role: 'owner',
        joined_at: now,
      });

      return this.getCommunityBySlug(finalSlug, userId);
    }
  }

  static async toggleJoinCommunity(slug, userId) {
    const isConnected = await checkPgConnection();
    const cleanSlug = slug.toLowerCase().trim();

    if (isConnected) {
      const commCheck = await pool.query('SELECT id, owner_id, member_count FROM communities WHERE LOWER(slug) = $1', [cleanSlug]);
      if (commCheck.rows.length === 0) {
        const err = new Error('Comunidad no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const comm = commCheck.rows[0];
      const memberCheck = await pool.query('SELECT id, role FROM community_members WHERE community_id = $1 AND user_id = $2', [comm.id, userId]);
      let isMember = false;

      if (memberCheck.rows.length > 0) {
        if (memberCheck.rows[0].role === 'owner') {
          const err = new Error('El creador de la comunidad no puede abandonarla.');
          err.statusCode = 400;
          throw err;
        }
        await pool.query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [comm.id, userId]);
        await pool.query('UPDATE communities SET member_count = GREATEST(1, member_count - 1) WHERE id = $1', [comm.id]);
        isMember = false;
      } else {
        await pool.query('INSERT INTO community_members (id, community_id, user_id, role) VALUES ($1, $2, $3, $4)', [generateId('cm'), comm.id, userId, 'member']);
        await pool.query('UPDATE communities SET member_count = member_count + 1 WHERE id = $1', [comm.id]);
        isMember = true;
      }

      const updated = await pool.query('SELECT member_count FROM communities WHERE id = $1', [comm.id]);
      return { is_member: isMember, member_count: updated.rows[0].member_count };
    } else {
      await memoryStore.init();
      const comm = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!comm) {
        const err = new Error('Comunidad no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const memberIdx = memoryStore.tables.community_members.findIndex(cm => cm.community_id === comm.id && cm.user_id === userId);
      let isMember = false;

      if (memberIdx !== -1) {
        if (memoryStore.tables.community_members[memberIdx].role === 'owner') {
          const err = new Error('El creador de la comunidad no puede abandonarla.');
          err.statusCode = 400;
          throw err;
        }
        memoryStore.tables.community_members.splice(memberIdx, 1);
        comm.member_count = Math.max(1, (comm.member_count || 1) - 1);
        isMember = false;
      } else {
        memoryStore.tables.community_members.push({
          id: generateId('cm'),
          community_id: comm.id,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString(),
        });
        comm.member_count = (comm.member_count || 1) + 1;
        isMember = true;
      }

      return { is_member: isMember, member_count: comm.member_count };
    }
  }

  static async getCommunityPosts(slug, currentUserId = null) {
    const isConnected = await checkPgConnection();
    const cleanSlug = slug.toLowerCase().trim();

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
          json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'image_url', c.image_url) as community
        FROM community_posts cp
        JOIN communities c ON c.id = cp.community_id
        JOIN posts p ON p.id = cp.post_id
        JOIN users u ON u.id = p.user_id
        JOIN user_profiles prof ON prof.user_id = p.user_id
        WHERE LOWER(c.slug) = $2
        ORDER BY p.created_at DESC`,
        [currentUserId, cleanSlug]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const comm = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!comm) return [];

      const postIds = memoryStore.tables.community_posts
        .filter(cp => cp.community_id === comm.id)
        .map(cp => cp.post_id);

      return postIds
        .map(id => memoryStore.getPopulatedPost(id, currentUserId))
        .filter(Boolean)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  static async getCommunityMembers(slug) {
    const isConnected = await checkPgConnection();
    const cleanSlug = slug.toLowerCase().trim();

    if (isConnected) {
      const result = await pool.query(
        `SELECT cm.role, cm.joined_at,
          u.id, prof.full_name, prof.username, prof.avatar_url, prof.bio
        FROM community_members cm
        JOIN communities c ON c.id = cm.community_id
        JOIN users u ON u.id = cm.user_id
        JOIN user_profiles prof ON prof.user_id = u.id
        WHERE LOWER(c.slug) = $1
        ORDER BY CASE WHEN cm.role = 'owner' THEN 1 WHEN cm.role = 'moderator' THEN 2 ELSE 3 END, cm.joined_at ASC`,
        [cleanSlug]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const comm = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!comm) return [];

      return memoryStore.tables.community_members
        .filter(cm => cm.community_id === comm.id)
        .map(cm => {
          const user = memoryStore.getPopulatedUser(cm.user_id);
          return {
            role: cm.role,
            joined_at: cm.joined_at,
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            avatar_url: user.avatar_url,
            bio: user.bio,
          };
        });
    }
  }
}
