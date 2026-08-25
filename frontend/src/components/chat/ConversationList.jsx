import React, { useState } from 'react';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { formatRelativeTime } from '../../utils/formatters.jsx';

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onStartNewChat,
  suggestedUsers = [],
}) {
  const { onlineUsers } = useSocket();
  const [filter, setFilter] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const filtered = conversations.filter((c) => {
    const name = c.participant?.full_name?.toLowerCase() || '';
    const username = c.participant?.username?.toLowerCase() || '';
    const q = filter.toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  const handleStartWithUser = (targetUserId) => {
    setIsNewChatOpen(false);
    onStartNewChat(targetUserId);
  };

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200/80 bg-white/60 backdrop-blur-md h-full shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Mensajes</h2>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsNewChatOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold text-xs"
        >
          Nuevo Chat
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full bg-slate-100/80 border-none rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 stroke-[1.5] text-slate-300" />
            <p className="text-xs">No hay conversaciones activas.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewChatOpen(true)}
              className="mt-2 text-xs"
            >
              Iniciar un chat
            </Button>
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = activeId === c.id;
            const isOnline = c.participant && onlineUsers.has(c.participant.id);
            const hasUnread = c.unread_count > 0;

            return (
              <div
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-purple-50/80 border-l-4 border-purple-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <Avatar
                  src={c.participant?.avatar_url}
                  name={c.participant?.full_name}
                  size="md"
                  isOnline={isOnline}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-sm truncate ${
                        hasUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                      }`}
                    >
                      {c.participant?.full_name || 'Usuario'}
                    </span>
                    {c.last_message?.created_at && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatRelativeTime(c.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        hasUnread ? 'font-bold text-purple-700' : 'text-slate-500'
                      }`}
                    >
                      {c.last_message?.content || 'Inicia la conversación...'}
                    </p>
                    {hasUnread && (
                      <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for starting new chat */}
      <Modal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        title="Iniciar nueva conversación"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500">
            Selecciona a un usuario para abrir una conversación directa:
          </p>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {suggestedUsers.map((sug) => (
              <div
                key={sug.id}
                onClick={() => handleStartWithUser(sug.id)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50 cursor-pointer transition-colors border border-transparent hover:border-purple-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={sug.avatar_url} name={sug.full_name} size="md" />
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {sug.full_name}
                    </span>
                    <span className="text-xs text-slate-500">@{sug.username}</span>
                  </div>
                </div>
                <Button size="sm" variant="primary" className="text-xs">
                  Chatear
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
