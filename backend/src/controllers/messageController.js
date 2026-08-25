import { MessageService } from '../services/messageService.js';
import { sendMessageSchema } from '../validators/index.js';

export class MessageController {
  static async getConversations(req, res, next) {
    try {
      const conversations = await MessageService.getConversations(req.user.id);
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req, res, next) {
    try {
      const messages = await MessageService.getMessages(req.params.conversationId, req.user.id);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const validated = sendMessageSchema.parse(req.body);
      const message = await MessageService.sendMessage(req.user.id, validated);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const result = await MessageService.markAsRead(req.params.conversationId, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
