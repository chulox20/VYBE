import { pool, checkPgConnection, withTransaction } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId, slugify } from '../utils/helpers.js';

export class CommunityService {
  static async getCommunities(params) {
    return this.listCommunities(params);
  }

  static async listCommunities({ category = null, search = null } = {}) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      let queryText = `
        SELECT c.*,
          json_build_object(
            'id', u.id,
            'full_name', p.full_name,
            'username', p.username,
            'avatar_url', p.avatar_url
          ) as owner
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        JOIN user_profiles p ON p.user_id = c.owner_id
        WHERE 1=1
      `;
      const params = [];
      let idx = 1;

      if (category && category !== 'all' && category !== 'Todos') {
        queryText += ` AND LOWER(c.category) = LOWER($${idx++})`;
        params.push(category);
      }

      if (search) {
        queryText += ` AND (LOWER(c.name) LIKE LOWER($${idx}) OR LOWER(c.description) LIKE LOWER($${idx}))`;
        params.push(`%${search}%`);
      }

      queryText += ` ORDER BY c.member_count DESC, c.created_at DESC`;
      const result = await pool.query(queryText, params);
      return result.rows;
    } else {
      await memoryStore.init();
      let communities = [...memoryStore.tables.communities];

      if (category && category !== 'all' && category !== 'Todos') {
        communities = communities.filter(c => c.category?.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const s = search.toLowerCase();
        communities = communities.filter(c => c.name.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s));
      }

      return communities
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        .map(c => memoryStore.getPopulatedCommunity(c.id));
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
            'full_name', p.full_name,
            'username', p.username,
            'avatar_url', p.avatar_url
          ) as owner,
          EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member,
          (SELECT role FROM community_members WHERE community_id = c.id AND user_id = $1) as member_role
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        JOIN user_profiles p ON p.user_id = c.owner_id
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
      const comm = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!comm) {
        const err = new Error('Comunidad no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const populated = memoryStore.getPopulatedCommunity(comm.id);
      const member = currentUserId
        ? memoryStore.tables.community_members.find(m => m.community_id === comm.id && m.user_id === currentUserId)
        : null;

      return {
        ...populated,
        is_member: !!member,
        member_role: member ? member.role : null,
      };
    }
  }

  static async createCommunity(ownerId, { name, description = '', category = 'General', image_url = null, cover_url = null }) {
    const isConnected = await checkPgConnection();
    const commId = generateId('comm');
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = `community-${Date.now()}`;
    const now = new Date().toISOString();

    if (isConnected) {
      return await withTransaction(async (client) => {
        let finalSlug = baseSlug;
        const checkSlug = await client.query('SELECT 1 FROM communities WHERE slug = $1', [finalSlug]);
        if (checkSlug.rows.length > 0) {
          finalSlug = `${baseSlug}-${Math.floor(Math.random() * 900 + 100)}`;
        }

        await client.query(
          `INSERT INTO communities (id, name, slug, description, category, image_url, cover_url, owner_id, member_count, post_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 0)`,
          [commId, name, finalSlug, description, category, image_url, cover_url, ownerId]
        );

        await client.query(
          `INSERT INTO community_members (id, community_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
          [generateId('cm'), commId, ownerId]
        );

        const res = await client.query(
          `SELECT c.*,
            json_build_object('id', u.id, 'full_name', p.full_name, 'username', p.username, 'avatar_url', p.avatar_url) as owner,
            TRUE as is_member,
            'owner' as member_role
          FROM communities c
          JOIN users u ON u.id = c.owner_id
          JOIN user_profiles p ON p.user_id = c.owner_id
          WHERE c.id = $1`,
          [commId]
        );

        return res.rows[0];
      });
    } else {
      await memoryStore.init();
      let finalSlug = baseSlug;
      if (memoryStore.tables.communities.some(c => c.slug === finalSlug)) {
        finalSlug = `${baseSlug}-${Math.floor(Math.random() * 900 + 100)}`;
      }

      const newCommunity = {
        id: commId,
        name,
        slug: finalSlug,
        description,
        category,
        image_url,
        cover_url,
        owner_id: ownerId,
        member_count: 1,
        post_count: 0,
        is_private: false,
        created_at: now,
        updated_at: now,
      };

      memoryStore.tables.communities.push(newCommunity);
      memoryStore.tables.community_members.push({
        id: generateId('cm'),
        community_id: commId,
        user_id: ownerId,
        role: 'owner',
        joined_at: now,
      });

      return {
        ...newCommunity,
        owner: memoryStore.getPopulatedUser(ownerId),
        is_member: true,
        member_role: 'owner',
      };
    }
  }

  static async toggleJoinCommunity(slug, userId) {
    const isConnected = await checkPgConnection();
    const cleanSlug = slug.toLowerCase().trim();

    if (isConnected) {
      return await withTransaction(async (client) => {
        const commRes = await client.query('SELECT id, owner_id FROM communities WHERE LOWER(slug) = $1 FOR UPDATE', [cleanSlug]);
        if (commRes.rows.length === 0) {
          const err = new Error('Comunidad no encontrada.');
          err.statusCode = 404;
          throw err;
        }

        const { id: communityId, owner_id: ownerId } = commRes.rows[0];

        const memberRes = await client.query(
          'SELECT id, role FROM community_members WHERE community_id = $1 AND user_id = $2',
          [communityId, userId]
        );

        let isMember = false;

        if (memberRes.rows.length > 0) {
          if (ownerId === userId) {
            const err = new Error('El creador de la comunidad no puede abandonar su propia comunidad.');
            err.statusCode = 400;
            throw err;
          }
          await client.query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
          await client.query(
            'UPDATE communities SET member_count = (SELECT COUNT(*)::int FROM community_members WHERE community_id = $1) WHERE id = $1',
            [communityId]
          );
          isMember = false;
        } else {
          await client.query(
            'INSERT INTO community_members (id, community_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (community_id, user_id) DO NOTHING',
            [generateId('cm'), communityId, userId, 'member']
          );
          await client.query(
            'UPDATE communities SET member_count = (SELECT COUNT(*)::int FROM community_members WHERE community_id = $1) WHERE id = $1',
            [communityId]
          );
          isMember = true;
        }

        const countRes = await client.query('SELECT member_count FROM communities WHERE id = $1', [communityId]);
        return { is_member: isMember, member_count: countRes.rows[0].member_count };
      });
    } else {
      await memoryStore.init();
      const comm = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!comm) {
        const err = new Error('Comunidad no encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const memberIdx = memoryStore.tables.community_members.findIndex(
        m => m.community_id === comm.id && m.user_id === userId
      );

      let isMember = false;

      if (memberIdx !== -1) {
        if (comm.owner_id === userId) {
          const err = new Error('El creador de la comunidad no puede abandonar su propia comunidad.');
          err.statusCode = 400;
          throw err;
        }
        memoryStore.tables.community_members.splice(memberIdx, 1);
        isMember = false;
      } else {
        memoryStore.tables.community_members.push({
          id: generateId('cm'),
          community_id: comm.id,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString(),
        });
        isMember = true;
      }

      comm.member_count = memoryStore.tables.community_members.filter(m => m.community_id === comm.id).length;
      return { is_member: isMember, member_count: comm.member_count };
    }
  }

  static async getCommunityMembers(slug) {
    const isConnected = await checkPgConnection();
    const cleanSlug = slug.toLowerCase().trim();

    if (isConnected) {
      const result = await pool.query(
        `SELECT cm.role, cm.joined_at, u.id, p.full_name, p.username, p.avatar_url, p.bio
        FROM community_members cm
        JOIN communities c ON c.id = cm.community_id
        JOIN users u ON u.id = cm.user_id
        JOIN user_profiles p ON p.user_id = cm.user_id
        WHERE LOWER(c.slug) = $1
        ORDER BY CASE cm.role WHEN 'owner' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END, cm.joined_at ASC`,
        [cleanSlug]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const comm = memoryStore.tables.communities.find(c => c.slug.toLowerCase() === cleanSlug);
      if (!comm) return [];

      return memoryStore.tables.community_members
        .filter(m => m.community_id === comm.id)
        .map(m => {
          const author = memoryStore.getPopulatedUser(m.user_id);
          return {
            ...author,
            role: m.role,
            joined_at: m.joined_at,
          };
        });
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
        FROM posts p
        JOIN community_posts cp ON cp.post_id = p.id
        JOIN communities c ON c.id = cp.community_id
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
        .filter(Boolean);
    }
  }
}
