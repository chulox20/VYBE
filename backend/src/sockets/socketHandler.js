import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { MessageService } from '../services/messageService.js';
import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';

async function isUserMemberOfConversation(conversationId, userId) {
  const isConnected = await checkPgConnection();
  if (isConnected) {
    const res = await pool.query(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    return res.rows.length > 0;
  } else {
    await memoryStore.init();
    return memoryStore.tables.conversation_members.some(
      cm => cm.conversation_id === conversationId && cm.user_id === userId
    );
  }
}

export function initializeSockets(io) {
  const onlineUsers = new Map(); // userId -> socketId set

  // JWT Middleware for Socket.io (Strictly via handshake auth, never in query string)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required in auth payload'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status
    io.emit('user_status_change', { userId, status: 'online' });

    // Join active conversation room with STRICT authorization check
    socket.on('join_conversation', async (conversationId, callback) => {
      try {
        if (!conversationId) return;

        const isMember = await isUserMemberOfConversation(conversationId, userId);
        if (!isMember) {
          socket.emit('socket_error', {
            code: 'FORBIDDEN_CONVERSATION',
            message: 'No tienes permiso para unirte a esta conversación.',
          });
          if (typeof callback === 'function') {
            callback({ success: false, error: 'No tienes acceso a esta conversación.' });
          }
          return;
        }

        socket.join(`conv:${conversationId}`);
        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err) {
        socket.emit('socket_error', { message: err.message });
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
      }
    });

    // Real-time chat message
    socket.on('send_message', async (data, callback) => {
      try {
        const message = await MessageService.sendMessage(userId, data);
        const convRoom = `conv:${message.conversation_id}`;

        // Broadcast to everyone in conversation room
        io.to(convRoom).emit('message_received', message);

        if (typeof callback === 'function') {
          callback({ success: true, data: message });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Typing indicators with membership verification
    socket.on('typing_start', async ({ conversationId, username }) => {
      if (!conversationId) return;
      const isMember = await isUserMemberOfConversation(conversationId, userId);
      if (!isMember) return;

      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping: true,
      });
    });

    socket.on('typing_stop', async ({ conversationId }) => {
      if (!conversationId) return;
      const isMember = await isUserMemberOfConversation(conversationId, userId);
      if (!isMember) return;

      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Message read receipt with membership verification
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const isMember = await isUserMemberOfConversation(conversationId, userId);
        if (!isMember) return;

        await MessageService.markAsRead(conversationId, userId);
        socket.to(`conv:${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
          readAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error in mark_read socket event:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status_change', { userId, status: 'offline' });
        }
      }
    });
  });
}
