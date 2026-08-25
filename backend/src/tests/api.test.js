import http from 'http';
import { app, server } from '../server.js';

async function testBackend() {
  console.log('🧪 Iniciando pruebas de endpoints del Backend de VYBE...\n');
  
  const BASE_URL = 'http://localhost:5000/api';
  let adminToken = '';
  let userToken = '';
  let createdPostId = '';
  let createdCommentId = '';

  // Helper fetch
  async function request(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...options,
    });
    const json = await res.json();
    return { status: res.status, data: json };
  }

  try {
    // Wait for server ready
    await new Promise(r => setTimeout(r, 1000));

    // 1. Health check
    const health = await request('/health');
    console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 2. Login as Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@vybe.app', password: 'Password123!' }),
    });
    if (adminLogin.status === 200 && adminLogin.data.data.token) {
      adminToken = adminLogin.data.data.token;
      console.log('2. Admin Login:', '✅ PASSED');
    } else {
      console.error('2. Admin Login:', '❌ FAILED', adminLogin);
    }

    // 3. Login as User (chulox)
    const userLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'chulox@vybe.app', password: 'Password123!' }),
    });
    if (userLogin.status === 200 && userLogin.data.data.token) {
      userToken = userLogin.data.data.token;
      console.log('3. User Login (chulox):', '✅ PASSED');
    } else {
      console.error('3. User Login (chulox):', '❌ FAILED', userLogin);
    }

    // 4. Get Feed
    const feed = await request('/posts/feed', { token: userToken });
    console.log('4. Get Feed:', feed.status === 200 && feed.data.data.posts.length > 0 ? `✅ PASSED (${feed.data.data.posts.length} posts)` : '❌ FAILED');

    // 5. Create Post
    const createPost = await request('/posts', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        content: 'Probando la API de VYBE en vivo ⚡ Todo funcionando al 100% #VybeTest #React',
        visibility: 'public',
      }),
    });
    if (createPost.status === 201 && createPost.data.data.id) {
      createdPostId = createPost.data.data.id;
      console.log('5. Create Post:', `✅ PASSED (ID: ${createdPostId})`);
    } else {
      console.error('5. Create Post:', '❌ FAILED', createPost);
    }

    // 6. Like Post
    const likePost = await request(`/posts/${createdPostId}/like`, {
      method: 'POST',
      token: adminToken,
    });
    console.log('6. Like Post (Admin likes post):', likePost.status === 200 && likePost.data.data.is_liked === true ? '✅ PASSED' : '❌ FAILED');

    // 7. Comment on Post
    const comment = await request(`/comments/post/${createdPostId}`, {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({ content: 'Excelente publicación de prueba 🔥' }),
    });
    if (comment.status === 201 && comment.data.data.id) {
      createdCommentId = comment.data.data.id;
      console.log('7. Create Comment:', `✅ PASSED (ID: ${createdCommentId})`);
    } else {
      console.error('7. Create Comment:', '❌ FAILED', comment);
    }

    // 8. Follow User
    const follow = await request('/users/maya.design/follow', {
      method: 'POST',
      token: userToken,
    });
    console.log('8. Toggle Follow:', follow.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 9. Get Communities
    const comms = await request('/communities');
    console.log('9. Get Communities:', comms.status === 200 && comms.data.data.length > 0 ? `✅ PASSED (${comms.data.data.length} communities)` : '❌ FAILED');

    // 10. Send Message
    const msg = await request('/messages/send', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        recipient_id: 'usr_maya',
        content: '¡Hola Maya! Probando el chat directo.',
      }),
    });
    console.log('10. Send Direct Message:', msg.status === 201 ? '✅ PASSED' : '❌ FAILED');

    // 11. Get Notifications
    const notifs = await request('/notifications', { token: userToken });
    console.log('11. Get Notifications:', notifs.status === 200 ? `✅ PASSED (${notifs.data.data.notifications.length} notifs, unread: ${notifs.data.data.unread_count})` : '❌ FAILED');

    // 12. Explore Trending & Search
    const explore = await request('/explore/trending');
    const search = await request('/explore/search?q=React');
    console.log('12. Explore & Search:', explore.status === 200 && search.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 13. Admin Stats & Reports
    const stats = await request('/admin/stats', { token: adminToken });
    const reports = await request('/admin/reports', { token: adminToken });
    console.log('13. Admin Dashboard & Reports:', stats.status === 200 && reports.status === 200 ? '✅ PASSED' : '❌ FAILED');

    console.log('\n🎉 Todas las pruebas del Backend de VYBE completadas con éxito!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando pruebas:', err);
    server.close();
    process.exit(1);
  }
}

testBackend();
