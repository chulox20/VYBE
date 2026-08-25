import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image, Smile, Check, CheckCheck, Loader2, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { api } from '../../services/api.js';
import { Avatar } from '../ui/Avatar.jsx';
import { formatRelativeTime } from '../../utils/formatters.jsx';

const EMOJIS = ['👋', '🔥', '🚀', '❤️', '😂', '👍', '🎉', '⚡', '🙌', '👀'];

export function ChatWindow({ conversationId, onBack = null }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [participant, setParticipant] = useState(null);
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    async function loadMessages() {
      try {
        setLoading(true);
        const res = await api.get(`/messages/${conversationId}`);
        if (isMounted && res.success && res.data) {
          setMessages(res.data);
          // Find other participant from conversation
          const convRes = await api.get('/messages/conversations');
          if (convRes.success && convRes.data) {
            const currentConv = convRes.data.find(c => c.id === conversationId);
            if (currentConv) {
              setParticipant(currentConv.participant);
            }
          }
        }
      } catch (err) {
        console.error('Error loading chat messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMessages();

    // Join room in socket
    if (socket) {
      socket.emit('join_conversation', conversationId);
      socket.emit('mark_read', { conversationId });
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.emit('leave_conversation', conversationId);
      }
    };
  }, [conversationId, socket]);

  // Real-time socket events for messages and typing
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (msg) => {
      if (msg.conversation_id === conversationId) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
        socket.emit('mark_read', { conversationId });
      }
    };

    const handleTyping = ({ conversationId: cId, username, isTyping }) => {
      if (cId === conversationId && username !== user?.username) {
        if (isTyping) {
          setTypingUser(username);
        } else {
          setTypingUser(null);
        }
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (socket) {
      socket.emit('typing_start', {
        conversationId,
        username: user?.username,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId });
      }, 2000);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imageFile) return;

    const content = inputText.trim();
    setInputText('');

    if (socket) {
      socket.emit('typing_stop', { conversationId });
    }

    try {
      let uploadedUrl = null;
      if (imageFile) {
        uploadedUrl = await api.uploadFile(imageFile);
        removeImage();
      }

      if (socket && socket.connected) {
        socket.emit('send_message', {
          conversation_id: conversationId,
          content,
          image_url: uploadedUrl,
        });
      } else {
        const res = await api.post('/messages/send', {
          conversation_id: conversationId,
          content,
          image_url: uploadedUrl,
        });
        if (res.success && res.data) {
          setMessages(prev => [...prev, res.data]);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const isOnline = participant && onlineUsers.has(participant.id);

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Selecciona una conversación para comenzar a chatear.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Active Chat Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {participant && (
            <Avatar
              src={participant.avatar_url}
              name={participant.full_name}
              size="md"
              isOnline={isOnline}
              onClick={() => navigate(`/profile/${participant.username}`)}
            />
          )}

          <div className="flex flex-col">
            <span
              onClick={() => participant && navigate(`/profile/${participant.username}`)}
              className="text-sm font-bold text-slate-900 hover:text-purple-600 cursor-pointer transition-colors"
            >
              {participant?.full_name || 'Conversación'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {isOnline ? 'En línea' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-purple-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <p className="text-xs">No hay mensajes aún. ¡Envía un saludo!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${
                  isMine ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`rounded-3xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
                    isMine
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200/60'
                  }`}
                >
                  {msg.content}

                  {msg.image_url && (
                    <div className="mt-2 rounded-xl overflow-hidden max-h-60">
                      <img src={msg.image_url} alt="Attachment" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-medium">
                  <span>{formatRelativeTime(msg.created_at)}</span>
                  {isMine && (
                    <span>
                      {msg.read_at ? (
                        <CheckCheck className="w-3 h-3 text-purple-600" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUser && (
          <div className="self-start flex items-center gap-2 bg-slate-100 text-slate-500 text-xs px-3.5 py-1.5 rounded-full animate-pulse border border-slate-200/60">
            <span>{typingUser} está escribiendo...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popover */}
      {showEmojis && (
        <div className="p-2 border-t border-slate-100 bg-purple-50/70 flex items-center gap-2 overflow-x-auto">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText(prev => prev + emoji);
              }}
              className="text-lg p-1 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Image Preview before send */}
      {imagePreview && (
        <div className="p-3 border-t border-slate-100 flex items-center gap-3 bg-slate-50">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900 text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium">Imagen lista para enviar</span>
        </div>
      )}

      {/* Message Composer Bar */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
        >
          <Image className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          className="p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Escribe un mensaje en tiempo real..."
          className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !imageFile}
          className="p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
