import bcrypt from 'bcryptjs';

class MemoryStore {
  constructor() {
    this.initialized = false;
    this.tables = {
      users: [],
      user_profiles: [],
      posts: [],
      post_likes: [],
      comments: [],
      saved_posts: [],
      follows: [],
      communities: [],
      community_members: [],
      community_posts: [],
      conversations: [],
      conversation_members: [],
      messages: [],
      notifications: [],
      reports: [],
    };
  }

  async init() {
    if (this.initialized) return;

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const now = new Date().toISOString();

    // 1. Users
    this.tables.users = [
      { id: 'usr_admin', email: 'admin@vybe.app', password_hash: defaultPasswordHash, role: 'admin', status: 'active', created_at: now, updated_at: now },
      { id: 'usr_chulox', email: 'chulox@vybe.app', password_hash: defaultPasswordHash, role: 'user', status: 'active', created_at: now, updated_at: now },
      { id: 'usr_maya', email: 'maya@vybe.app', password_hash: defaultPasswordHash, role: 'user', status: 'active', created_at: now, updated_at: now },
      { id: 'usr_alex', email: 'alex@vybe.app', password_hash: defaultPasswordHash, role: 'user', status: 'active', created_at: now, updated_at: now },
      { id: 'usr_sarah', email: 'sarah@vybe.app', password_hash: defaultPasswordHash, role: 'user', status: 'active', created_at: now, updated_at: now },
      { id: 'usr_carlos', email: 'carlos@vybe.app', password_hash: defaultPasswordHash, role: 'user', status: 'active', created_at: now, updated_at: now },
    ];

    // 2. Profiles
    this.tables.user_profiles = [
      {
        user_id: 'usr_admin',
        full_name: 'Equipo VYBE',
        username: 'admin',
        bio: 'Cuenta oficial del equipo de ingeniería y moderación de VYBE. ¡Construyendo el futuro de la conexión social!',
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        website: 'https://vybe.app',
        location: 'Silicon Valley, CA',
        follower_count: 524,
        following_count: 12,
        post_count: 3,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 'usr_chulox',
        full_name: 'Jesús Pérez',
        username: 'chulox',
        bio: 'Desarrollador Full Stack & Open Source Enthusiast 🚀 Creando experiencias web ultra fluidas con React, Node y AI.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
        website: 'https://github.com/chulox20',
        location: 'Madrid, España',
        follower_count: 248,
        following_count: 184,
        post_count: 5,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 'usr_maya',
        full_name: 'Maya Lin',
        username: 'maya.design',
        bio: 'Design Systems Lead 🎨 Obsesionada con la tipografía, los micro-interacciones y la accesibilidad web.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
        website: 'https://maya.design',
        location: 'San Francisco, CA',
        follower_count: 612,
        following_count: 230,
        post_count: 4,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 'usr_alex',
        full_name: 'Alex Rivera',
        username: 'alex.ai',
        bio: 'AI Researcher & ML Engineer 🤖 Explorando agentes autónomos, LLMs y sistemas distribuidos en tiempo real.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
        website: 'https://alexrivera.dev',
        location: 'Austin, TX',
        follower_count: 419,
        following_count: 156,
        post_count: 3,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 'usr_sarah',
        full_name: 'Sarah Jenkins',
        username: 'sarah_code',
        bio: 'Cloud Architect & Backend Ninja ⚡ Kubernetes, PostgreSQL & Serverless pipelines.',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        website: 'https://sarahcloud.io',
        location: 'Seattle, WA',
        follower_count: 380,
        following_count: 190,
        post_count: 2,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 'usr_carlos',
        full_name: 'Carlos Mendoza',
        username: 'carlos_dev',
        bio: 'Frontend Engineer @ Startup. Amante de React Server Components, TypeScript y buenas animaciones en CSS.',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
        website: 'https://carlosmendoza.dev',
        location: 'Buenos Aires, Argentina',
        follower_count: 195,
        following_count: 140,
        post_count: 2,
        created_at: now,
        updated_at: now,
      },
    ];

    // 3. Follows
    this.tables.follows = [
      { id: 'flw_1', follower_id: 'usr_chulox', following_id: 'usr_maya', created_at: now },
      { id: 'flw_2', follower_id: 'usr_chulox', following_id: 'usr_alex', created_at: now },
      { id: 'flw_3', follower_id: 'usr_chulox', following_id: 'usr_admin', created_at: now },
      { id: 'flw_4', follower_id: 'usr_maya', following_id: 'usr_chulox', created_at: now },
      { id: 'flw_5', follower_id: 'usr_alex', following_id: 'usr_chulox', created_at: now },
      { id: 'flw_6', follower_id: 'usr_carlos', following_id: 'usr_chulox', created_at: now },
      { id: 'flw_7', follower_id: 'usr_sarah', following_id: 'usr_alex', created_at: now },
    ];

    // 4. Communities
    this.tables.communities = [
      {
        id: 'comm_react',
        owner_id: 'usr_chulox',
        name: 'React Developers',
        slug: 'react-developers',
        description: 'Comunidad dedicada a React 19, Next.js, Vite, Server Components y arquitecturas frontend escalables.',
        category: 'Frontend & UI',
        image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
        member_count: 1420,
        post_count: 84,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'comm_uiux',
        owner_id: 'usr_maya',
        name: 'UI/UX Designers',
        slug: 'ui-ux-designers',
        description: 'Espacio para diseñadores de producto, UX research, Figma tips, diseño de interacción y accesibilidad.',
        category: 'Diseño',
        image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80',
        member_count: 980,
        post_count: 52,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'comm_ai',
        owner_id: 'usr_alex',
        name: 'AI Builders',
        slug: 'ai-builders',
        description: 'Desarrolladores explorando LLMs, agentes autónomos, RAG, embeddings y productos impulsados por Inteligencia Artificial.',
        category: 'Inteligencia Artificial',
        image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
        member_count: 2150,
        post_count: 120,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'comm_cloud',
        owner_id: 'usr_sarah',
        name: 'Cloud & DevOps',
        slug: 'cloud-devops',
        description: 'Infraestructura como código, Docker, Kubernetes, CI/CD, monitorización y optimización de bases de datos.',
        category: 'Backend & Cloud',
        image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
        member_count: 730,
        post_count: 36,
        created_at: now,
        updated_at: now,
      },
    ];

    // 5. Community Members
    this.tables.community_members = [
      { id: 'cm_1', community_id: 'comm_react', user_id: 'usr_chulox', role: 'owner', joined_at: now },
      { id: 'cm_2', community_id: 'comm_react', user_id: 'usr_carlos', role: 'member', joined_at: now },
      { id: 'cm_3', community_id: 'comm_react', user_id: 'usr_maya', role: 'member', joined_at: now },
      { id: 'cm_4', community_id: 'comm_uiux', user_id: 'usr_maya', role: 'owner', joined_at: now },
      { id: 'cm_5', community_id: 'comm_uiux', user_id: 'usr_chulox', role: 'member', joined_at: now },
      { id: 'cm_6', community_id: 'comm_ai', user_id: 'usr_alex', role: 'owner', joined_at: now },
      { id: 'cm_7', community_id: 'comm_ai', user_id: 'usr_chulox', role: 'member', joined_at: now },
      { id: 'cm_8', community_id: 'comm_cloud', user_id: 'usr_sarah', role: 'owner', joined_at: now },
    ];

    // 6. Posts
    this.tables.posts = [
      {
        id: 'pst_1',
        user_id: 'usr_chulox',
        content: '¡Bienvenidos oficialmente a VYBE! 🎉 Diseñé esta plataforma pensando en velocidad, simplicidad y comunidades reales. ¿Qué opinan del diseño y la paleta en tonos púrpura y magenta? #React #WebDevelopment #Design',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
        visibility: 'public',
        like_count: 42,
        comment_count: 6,
        share_count: 14,
        bookmark_count: 19,
        created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        updated_at: now,
      },
      {
        id: 'pst_2',
        user_id: 'usr_maya',
        content: 'Acabo de publicar la nueva guía de Micro-interacciones para 2026. Los pequeños detalles en botones, transiciones de layout y feedback táctil son lo que eleva una app de normal a extraordinaria. ✨ #Design #UI #UX',
        image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80',
        visibility: 'public',
        like_count: 88,
        comment_count: 12,
        share_count: 27,
        bookmark_count: 35,
        created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        updated_at: now,
      },
      {
        id: 'pst_3',
        user_id: 'usr_alex',
        content: 'La integración de agentes autónomos con WebSockets y streaming reactivo permite construir interfaces con latencias sub-100ms. El futuro del software no son botones estáticos, sino asistentes conversacionales contextuales. 🤖⚡ #AI #Programming #Tech',
        image_url: null,
        visibility: 'public',
        like_count: 64,
        comment_count: 8,
        share_count: 18,
        bookmark_count: 22,
        created_at: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
        updated_at: now,
      },
      {
        id: 'pst_4',
        user_id: 'usr_sarah',
        content: 'Optimización de PostgreSQL: añadir índices compuestos en (user_id, created_at DESC) y usar paginación basada en cursor redujo nuestros tiempos de respuesta en el feed en un 85%. ¡Arquitectura limpia siempre paga dividendos! 📈 #PostgreSQL #Backend',
        image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1000&auto=format&fit=crop&q=80',
        visibility: 'public',
        like_count: 105,
        comment_count: 15,
        share_count: 31,
        bookmark_count: 48,
        created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
        updated_at: now,
      },
      {
        id: 'pst_5',
        user_id: 'usr_admin',
        content: '📢 Novedad en VYBE: Ya puedes crear comunidades públicas, organizar debates temáticos y chatear en tiempo real con miembros de todo el mundo. ¡Explora las comunidades activas en la pestaña superior!',
        image_url: null,
        visibility: 'public',
        like_count: 130,
        comment_count: 21,
        share_count: 45,
        bookmark_count: 29,
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        updated_at: now,
      },
    ];

    // 7. Community Posts
    this.tables.community_posts = [
      { id: 'cp_1', community_id: 'comm_react', post_id: 'pst_1', created_at: now },
      { id: 'cp_2', community_id: 'comm_uiux', post_id: 'pst_2', created_at: now },
      { id: 'cp_3', community_id: 'comm_ai', post_id: 'pst_3', created_at: now },
      { id: 'cp_4', community_id: 'comm_cloud', post_id: 'pst_4', created_at: now },
    ];

    // 8. Post Likes
    this.tables.post_likes = [
      { id: 'pl_1', user_id: 'usr_chulox', post_id: 'pst_2', created_at: now },
      { id: 'pl_2', user_id: 'usr_chulox', post_id: 'pst_3', created_at: now },
      { id: 'pl_3', user_id: 'usr_maya', post_id: 'pst_1', created_at: now },
      { id: 'pl_4', user_id: 'usr_alex', post_id: 'pst_1', created_at: now },
      { id: 'pl_5', user_id: 'usr_carlos', post_id: 'pst_1', created_at: now },
      { id: 'pl_6', user_id: 'usr_carlos', post_id: 'pst_4', created_at: now },
    ];

    // 9. Comments & Nested Replies
    this.tables.comments = [
      {
        id: 'cmt_1',
        post_id: 'pst_1',
        user_id: 'usr_maya',
        parent_comment_id: null,
        content: '¡Qué gran proyecto! El contraste de colores y la suavidad de las transiciones se ven de nivel top 🔥',
        like_count: 5,
        created_at: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
        updated_at: now,
      },
      {
        id: 'cmt_2',
        post_id: 'pst_1',
        user_id: 'usr_chulox',
        parent_comment_id: 'cmt_1',
        content: '¡Muchas gracias @maya.design! Tu feedback en UX fue clave para la estructura de las tarjetas.',
        like_count: 3,
        created_at: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
        updated_at: now,
      },
      {
        id: 'cmt_3',
        post_id: 'pst_1',
        user_id: 'usr_alex',
        parent_comment_id: null,
        content: 'La velocidad de carga y los WebSockets para notificaciones funcionan impecables ⚡',
        like_count: 2,
        created_at: new Date(Date.now() - 3600 * 1000 * 1.2).toISOString(),
        updated_at: now,
      },
      {
        id: 'cmt_4',
        post_id: 'pst_4',
        user_id: 'usr_chulox',
        parent_comment_id: null,
        content: 'Totalmente de acuerdo Sarah, la paginación por cursor en feeds de alto volumen es un game changer.',
        like_count: 4,
        created_at: new Date(Date.now() - 3600 * 1000 * 15).toISOString(),
        updated_at: now,
      },
    ];

    // 10. Saved Posts
    this.tables.saved_posts = [
      { id: 'sp_1', user_id: 'usr_chulox', post_id: 'pst_2', created_at: now },
      { id: 'sp_2', user_id: 'usr_chulox', post_id: 'pst_4', created_at: now },
    ];

    // 11. Conversations
    this.tables.conversations = [
      { id: 'conv_1', title: null, is_group: false, created_at: now, updated_at: now },
      { id: 'conv_2', title: null, is_group: false, created_at: now, updated_at: now },
    ];

    // 12. Conversation Members
    this.tables.conversation_members = [
      { id: 'cmem_1', conversation_id: 'conv_1', user_id: 'usr_chulox', last_read_at: now, created_at: now },
      { id: 'cmem_2', conversation_id: 'conv_1', user_id: 'usr_maya', last_read_at: now, created_at: now },
      { id: 'cmem_3', conversation_id: 'conv_2', user_id: 'usr_chulox', last_read_at: now, created_at: now },
      { id: 'cmem_4', conversation_id: 'conv_2', user_id: 'usr_alex', last_read_at: now, created_at: now },
    ];

    // 13. Messages
    this.tables.messages = [
      {
        id: 'msg_1',
        conversation_id: 'conv_1',
        sender_id: 'usr_maya',
        content: '¡Hola Jesús! Estuve revisando el diseño de las comunidades en VYBE, quedó espectacular 🎨',
        image_url: null,
        read_at: now,
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
      {
        id: 'msg_2',
        conversation_id: 'conv_1',
        sender_id: 'usr_chulox',
        content: '¡Hola Maya! Me alegro mucho que te guste. Agregué los micro-estados de typing y lectura en tiempo real con Socket.IO.',
        image_url: null,
        read_at: now,
        created_at: new Date(Date.now() - 3600 * 1000 * 2.8).toISOString(),
      },
      {
        id: 'msg_3',
        conversation_id: 'conv_1',
        sender_id: 'usr_maya',
        content: 'Genial, lo acabo de probar y se siente super fluido. ¡Excelente trabajo!',
        image_url: null,
        read_at: now,
        created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
      },
      {
        id: 'msg_4',
        conversation_id: 'conv_2',
        sender_id: 'usr_alex',
        content: 'Hey Jesús, ¿armamos un post conjunto sobre arquitecturas de agentes autónomos?',
        image_url: null,
        read_at: now,
        created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      },
    ];

    // 14. Notifications
    this.tables.notifications = [
      {
        id: 'notif_1',
        user_id: 'usr_chulox',
        type: 'like',
        actor_id: 'usr_maya',
        post_id: 'pst_1',
        message: 'A Maya Lin le gustó tu publicación',
        is_read: false,
        read_at: null,
        created_at: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
      },
      {
        id: 'notif_2',
        user_id: 'usr_chulox',
        type: 'comment',
        actor_id: 'usr_maya',
        post_id: 'pst_1',
        message: 'Maya Lin comentó en tu publicación: "¡Qué gran proyecto!..."',
        is_read: false,
        read_at: null,
        created_at: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
      },
      {
        id: 'notif_3',
        user_id: 'usr_chulox',
        type: 'follow',
        actor_id: 'usr_carlos',
        post_id: null,
        message: 'Carlos Mendoza comenzó a seguirte',
        is_read: true,
        read_at: now,
        created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      },
      {
        id: 'notif_4',
        user_id: 'usr_chulox',
        type: 'system',
        actor_id: 'usr_admin',
        post_id: null,
        message: '¡Bienvenido a VYBE! Tu cuenta ha sido verificada con éxito.',
        is_read: true,
        read_at: now,
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
    ];

    // 15. Reports (Admin moderation)
    this.tables.reports = [
      {
        id: 'rep_1',
        reporter_id: 'usr_carlos',
        target_type: 'post',
        target_id: 'pst_3',
        reason: 'Posible contenido no categorizado correctamente',
        status: 'pending',
        notes: 'Verificar si pertenece a la comunidad AI Builders',
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      },
    ];

    this.initialized = true;
  }

  // Get table reference
  table(name) {
    if (!this.tables[name]) {
      this.tables[name] = [];
    }
    return this.tables[name];
  }

  // Profile joined helper
  getPopulatedUser(userId) {
    const user = this.tables.users.find(u => u.id === userId);
    if (!user) return null;
    const profile = this.tables.user_profiles.find(p => p.user_id === userId) || {};
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      full_name: profile.full_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      cover_url: profile.cover_url || '',
      website: profile.website || '',
      location: profile.location || '',
      follower_count: profile.follower_count || 0,
      following_count: profile.following_count || 0,
      post_count: profile.post_count || 0,
    };
  }

  // Post populated helper
  getPopulatedPost(postId, currentUserId = null) {
    const post = this.tables.posts.find(p => p.id === postId);
    if (!post) return null;
    const author = this.getPopulatedUser(post.user_id);
    const isLiked = currentUserId ? this.tables.post_likes.some(l => l.user_id === currentUserId && l.post_id === postId) : false;
    const isSaved = currentUserId ? this.tables.saved_posts.some(s => s.user_id === currentUserId && s.post_id === postId) : false;
    
    // Community link if any
    const commPost = this.tables.community_posts.find(cp => cp.post_id === postId);
    let community = null;
    if (commPost) {
      const comm = this.tables.communities.find(c => c.id === commPost.community_id);
      if (comm) {
        community = { id: comm.id, name: comm.name, slug: comm.slug, image_url: comm.image_url };
      }
    }

    return {
      ...post,
      author,
      is_liked: isLiked,
      is_saved: isSaved,
      community,
    };
  }

  // Community populated helper
  getPopulatedCommunity(communityId) {
    const comm = this.tables.communities.find(c => c.id === communityId);
    if (!comm) return null;
    const owner = this.getPopulatedUser(comm.owner_id);
    return {
      ...comm,
      owner,
    };
  }
}

export const memoryStore = new MemoryStore();

