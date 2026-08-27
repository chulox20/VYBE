import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class MessageService {
  static async getConversations(userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT c.id, c.title, c.is_group, c.updated_at,
          (
            SELECT json_build_object(
              'id', other_u.id,
              'full_name', other_p.full_name,
              'username', other_p.username,
              'avatar_url', other_p.avatar_url
            )
            FROM conversation_members other_cm
            JOIN users other_u ON other_u.id = other_cm.user_id
            JOIN user_profiles other_p ON other_p.user_id = other_u.id
            WHERE other_cm.conversation_id = c.id AND other_cm.user_id != $1
            LIMIT 1
          ) as participant,
          (
            SELECT json_build_object(
              'id', m.id,
              'sender_id', m.sender_id,
              'content', m.content,
              'created_at', m.created_at
            )
            FROM messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*)::int
            FROM messages m
            JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = $1
            WHERE m.conversation_id = c.id AND m.sender_id != $1 AND (m.created_at > cm.last_read_at OR cm.last_read_at IS NULL)
          ) as unread_count
        FROM conversations c
        JOIN conversation_members cm ON cm.conversation_id = c.id
        WHERE cm.user_id = $1
        ORDER BY c.updated_at DESC`,
        [userId]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const userConvs = memoryStore.tables.conversation_members
        .filter(cm => cm.user_id === userId)
        .map(cm => cm.conversation_id);

      const conversations = [];

      for (const cId of userConvs) {
        const conv = memoryStore.tables.conversations.find(c => c.id === cId);
        if (!conv) continue;

        const otherMember = memoryStore.tables.conversation_members.find(cm => cm.conversation_id === cId && cm.user_id !== userId);
        const participant = otherMember ? memoryStore.getPopulatedUser(otherMember.user_id) : null;

        const convMessages = memoryStore.tables.messages
          .filter(m => m.conversation_id === cId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const lastMessage = convMessages[0] || null;
        const myMember = memoryStore.tables.conversation_members.find(cm => cm.conversation_id === cId && cm.user_id === userId);
        const lastRead = myMember ? new Date(myMember.last_read_at).getTime() : 0;

        const unreadCount = convMessages.filter(m => m.sender_id !== userId && new Date(m.created_at).getTime() > lastRead).length;

        conversations.push({
          id: conv.id,
          title: conv.title,
          is_group: conv.is_group,
          updated_at: conv.updated_at,
          participant: participant ? {
            id: participant.id,
            full_name: participant.full_name,
            username: participant.username,
            avatar_url: participant.avatar_url,
          } : null,
          last_message: lastMessage ? {
            id: lastMessage.id,
            sender_id: lastMessage.sender_id,
            content: lastMessage.content,
            created_at: lastMessage.created_at,
          } : null,
          unread_count: unreadCount,
        });
      }

      return conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
  }

  static async getOrCreateConversation(userId, targetUserId) {
    if (userId === targetUserId) {
      const err = new Error('No puedes iniciar una conversación contigo mismo.');
      err.statusCode = 400;
      throw err;
    }

    const isConnected = await checkPgConnection();
    if (isConnected) {
      return await withTransaction(async (client) => {
        const [u1, u2] = [userId, targetUserId].sort();

        const existing = await client.query(
          `SELECT cm1.conversation_id
           FROM conversation_members cm1
           JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
           JOIN conversations c ON c.id = cm1.conversation_id
           WHERE cm1.user_id = $1 AND cm2.user_id = $2 AND c.is_group = FALSE
           LIMIT 1`,
          [u1, u2]
        );

        if (existing.rows.length > 0) {
          return existing.rows[0].conversation_id;
        }

        const convId = generateId('conv');
        await client.query(`INSERT INTO conversations (id, is_group) VALUES ($1, FALSE)`, [convId]);
        await client.query(`INSERT INTO conversation_members (id, conversation_id, user_id) VALUES ($1, $2, $3)`, [generateId('cmem'), convId, u1]);
        await client.query(`INSERT INTO conversation_members (id, conversation_id, user_id) VALUES ($1, $2, $3)`, [generateId('cmem'), convId, u2]);
        return convId;
      });
    } else {
      await memoryStore.init();
      // Check existing 1-on-1 conversation
      const userConvs = memoryStore.tables.conversation_members
        .filter(cm => cm.user_id === userId)
        .map(cm => cm.conversation_id);

      for (const cId of userConvs) {
        const hasTarget = memoryStore.tables.conversation_members.some(cm => cm.conversation_id === cId && cm.user_id === targetUserId);
        const conv = memoryStore.tables.conversations.find(c => c.id === cId);
        if (hasTarget && conv && !conv.is_group) {
          return cId;
        }
      }

      const convId = generateId('conv');
      const now = new Date().toISOString();

      memoryStore.tables.conversations.push({
        id: convId,
        title: null,
        is_group: false,
        created_at: now,
        updated_at: now,
      });

      memoryStore.tables.conversation_members.push(
        { id: generateId('cmem'), conversation_id: convId, user_id: userId, last_read_at: now, created_at: now },
        { id: generateId('cmem'), conversation_id: convId, user_id: targetUserId, last_read_at: now, created_at: now }
      );

      return convId;
    }
  }

  static async getMessages(conversationId, userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const memberCheck = await pool.query(
        'SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, userId]
      );
      if (memberCheck.rows.length === 0) {
        const err = new Error('No tienes acceso a esta conversación.');
        err.statusCode = 403;
        throw err;
      }

      // Mark conversation as read
      await pool.query('UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND user_id = $2', [conversationId, userId]);

      const result = await pool.query(
        `SELECT m.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as sender
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        JOIN user_profiles prof ON prof.user_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC`,
        [conversationId]
      );
      return result.rows;
    } else {
      await memoryStore.init();
      const isMember = memoryStore.tables.conversation_members.some(cm => cm.conversation_id === conversationId && cm.user_id === userId);
      if (!isMember) {
        const err = new Error('No tienes acceso a esta conversación.');
        err.statusCode = 403;
        throw err;
      }

      const myMember = memoryStore.tables.conversation_members.find(cm => cm.conversation_id === conversationId && cm.user_id === userId);
      if (myMember) {
        myMember.last_read_at = new Date().toISOString();
      }

      return memoryStore.tables.messages
        .filter(m => m.conversation_id === conversationId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(m => {
          const sender = memoryStore.getPopulatedUser(m.sender_id);
          return {
            ...m,
            sender: {
              id: sender?.id,
              full_name: sender?.full_name,
              username: sender?.username,
              avatar_url: sender?.avatar_url,
            },
          };
        });
    }
  }

  static async sendMessage(senderId, { conversation_id, recipient_id, content, image_url = null }) {
    let convId = conversation_id;
    if (!convId && recipient_id) {
      convId = await this.getOrCreateConversation(senderId, recipient_id);
    }

    if (!convId) {
      const err = new Error('Se requiere un ID de conversación o destinatario.');
      err.statusCode = 400;
      throw err;
    }

    const isConnected = await checkPgConnection();
    const msgId = generateId('msg');
    const now = new Date().toISOString();

    if (isConnected) {
      await pool.query(
        `INSERT INTO messages (id, conversation_id, sender_id, content, image_url) VALUES ($1, $2, $3, $4, $5)`,
        [msgId, convId, senderId, content, image_url]
      );
      await pool.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [convId]);
      await pool.query('UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND user_id = $2', [convId, senderId]);

      // Notify other members
      const others = await pool.query(
        'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2',
        [convId, senderId]
      );

      for (const row of others.rows) {
        await NotificationService.createNotification({
          userId: row.user_id,
          actorId: senderId,
          type: 'message',
          postId: null,
          message: `te envió un mensaje: "${content.slice(0, 40)}..."`,
        });
      }

      const res = await pool.query(
        `SELECT m.*,
          json_build_object(
            'id', u.id,
            'full_name', prof.full_name,
            'username', prof.username,
            'avatar_url', prof.avatar_url
          ) as sender
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        JOIN user_profiles prof ON prof.user_id = u.id
        WHERE m.id = $1`,
        [msgId]
      );
      return res.rows[0];
    } else {
      await memoryStore.init();
      const newMsg = {
        id: msgId,
        conversation_id: convId,
        sender_id: senderId,
        content,
        image_url,
        read_at: null,
        created_at: now,
      };

      memoryStore.tables.messages.push(newMsg);
      const conv = memoryStore.tables.conversations.find(c => c.id === convId);
      if (conv) conv.updated_at = now;

      const myMember = memoryStore.tables.conversation_members.find(cm => cm.conversation_id === convId && cm.user_id === senderId);
      if (myMember) myMember.last_read_at = now;

      const otherMembers = memoryStore.tables.conversation_members.filter(cm => cm.conversation_id === convId && cm.user_id !== senderId);
      for (const om of otherMembers) {
        await NotificationService.createNotification({
          userId: om.user_id,
          actorId: senderId,
          type: 'message',
          postId: null,
          message: `te envió un mensaje: "${content.slice(0, 40)}..."`,
        });
      }

      const sender = memoryStore.getPopulatedUser(senderId);
      return {
        ...newMsg,
        sender: {
          id: sender?.id,
          full_name: sender?.full_name,
          username: sender?.username,
          avatar_url: sender?.avatar_url,
        },
      };
    }
  }

  static async markAsRead(conversationId, userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      await pool.query(
        'UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, userId]
      );
      return { success: true };
    } else {
      await memoryStore.init();
      const member = memoryStore.tables.conversation_members.find(cm => cm.conversation_id === conversationId && cm.user_id === userId);
      if (member) member.last_read_at = new Date().toISOString();
      return { success: true };
    }
  }
}
