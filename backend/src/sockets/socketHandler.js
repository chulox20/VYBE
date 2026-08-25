import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { MessageService } from '../services/messageService.js';
import { NotificationService } from '../services/notificationService.js';

export function initializeSockets(io) {
  const onlineUsers = new Map(); // userId -> socketId set

  // JWT Middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
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

    // Join active conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
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

    // Typing indicators
    socket.on('typing_start', ({ conversationId, username }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Message read receipt
    socket.on('mark_read', async ({ conversationId }) => {
      try {
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
