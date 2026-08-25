import bcrypt from 'bcryptjs';
import { pool, checkPgConnection } from './pool.js';
import { memoryStore } from './memoryStore.js';

async function seedDatabase() {
  console.log('🌱 Iniciando siembra de datos de prueba para VYBE...');
  try {
    const isConnected = await checkPgConnection();
    if (!isConnected) {
      console.log('ℹ️  PostgreSQL no disponible. Los datos en memoria de MemoryStore se inicializan automáticamente al iniciar la app.');
      process.exit(0);
    }

    await memoryStore.init();
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const now = new Date().toISOString();

    console.log('🧹 Limpiando tablas de PostgreSQL...');
    await pool.query(`
      TRUNCATE TABLE reports, notifications, messages, conversation_members, conversations,
      community_posts, community_members, communities, follows, saved_posts, comments,
      post_likes, posts, user_profiles, users CASCADE;
    `);

    console.log('👥 Insertando usuarios y perfiles...');
    for (const u of memoryStore.tables.users) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, u.email, defaultPasswordHash, u.role, u.status, u.created_at, u.updated_at]
      );
    }

    for (const p of memoryStore.tables.user_profiles) {
      await pool.query(
        `INSERT INTO user_profiles (user_id, full_name, username, bio, avatar_url, cover_url, website, location, follower_count, following_count, post_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [p.user_id, p.full_name, p.username, p.bio, p.avatar_url, p.cover_url, p.website, p.location, p.follower_count, p.following_count, p.post_count, p.created_at, p.updated_at]
      );
    }

    console.log('🤝 Insertando relaciones follows...');
    for (const f of memoryStore.tables.follows) {
      await pool.query(
        `INSERT INTO follows (id, follower_id, following_id, created_at) VALUES ($1, $2, $3, $4)`,
        [f.id, f.follower_id, f.following_id, f.created_at]
      );
    }

    console.log('🏛️ Insertando comunidades...');
    for (const c of memoryStore.tables.communities) {
      await pool.query(
        `INSERT INTO communities (id, owner_id, name, slug, description, category, image_url, cover_url, member_count, post_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [c.id, c.owner_id, c.name, c.slug, c.description, c.category, c.image_url, c.cover_url, c.member_count, c.post_count, c.created_at, c.updated_at]
      );
    }

    for (const cm of memoryStore.tables.community_members) {
      await pool.query(
        `INSERT INTO community_members (id, community_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4, $5)`,
        [cm.id, cm.community_id, cm.user_id, cm.role, cm.joined_at]
      );
    }

    console.log('📝 Insertando posts...');
    for (const po of memoryStore.tables.posts) {
      await pool.query(
        `INSERT INTO posts (id, user_id, content, image_url, visibility, like_count, comment_count, share_count, bookmark_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [po.id, po.user_id, po.content, po.image_url, po.visibility, po.like_count, po.comment_count, po.share_count, po.bookmark_count, po.created_at, po.updated_at]
      );
    }

    for (const cp of memoryStore.tables.community_posts) {
      await pool.query(
        `INSERT INTO community_posts (id, community_id, post_id, created_at) VALUES ($1, $2, $3, $4)`,
        [cp.id, cp.community_id, cp.post_id, cp.created_at]
      );
    }

    for (const lk of memoryStore.tables.post_likes) {
      await pool.query(
        `INSERT INTO post_likes (id, user_id, post_id, created_at) VALUES ($1, $2, $3, $4)`,
        [lk.id, lk.user_id, lk.post_id, lk.created_at]
      );
    }

    console.log('💬 Insertando comentarios...');
    for (const cm of memoryStore.tables.comments) {
      await pool.query(
        `INSERT INTO comments (id, post_id, user_id, parent_comment_id, content, like_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cm.id, cm.post_id, cm.user_id, cm.parent_comment_id, cm.content, cm.like_count, cm.created_at, cm.updated_at]
      );
    }

    for (const sp of memoryStore.tables.saved_posts) {
      await pool.query(
        `INSERT INTO saved_posts (id, user_id, post_id, created_at) VALUES ($1, $2, $3, $4)`,
        [sp.id, sp.user_id, sp.post_id, sp.created_at]
      );
    }

    console.log('💬 Insertando chats y mensajes...');
    for (const cv of memoryStore.tables.conversations) {
      await pool.query(
        `INSERT INTO conversations (id, title, is_group, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [cv.id, cv.title, cv.is_group, cv.created_at, cv.updated_at]
      );
    }

    for (const cm of memoryStore.tables.conversation_members) {
      await pool.query(
        `INSERT INTO conversation_members (id, conversation_id, user_id, last_read_at, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [cm.id, cm.conversation_id, cm.user_id, cm.last_read_at, cm.created_at]
      );
    }

    for (const msg of memoryStore.tables.messages) {
      await pool.query(
        `INSERT INTO messages (id, conversation_id, sender_id, content, image_url, read_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [msg.id, msg.conversation_id, msg.sender_id, msg.content, msg.image_url, msg.read_at, msg.created_at]
      );
    }

    console.log('🔔 Insertando notificaciones y reportes...');
    for (const n of memoryStore.tables.notifications) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, actor_id, post_id, message, is_read, read_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [n.id, n.user_id, n.type, n.actor_id, n.post_id, n.message, n.is_read, n.read_at, n.created_at]
      );
    }

    for (const r of memoryStore.tables.reports) {
      await pool.query(
        `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, notes, resolved_by, resolved_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [r.id, r.reporter_id, r.target_type, r.target_id, r.reason, r.status, r.notes, r.resolved_by, r.resolved_at, r.created_at]
      );
    }

    console.log('✅ Base de datos sembrada con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sembrando base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();
