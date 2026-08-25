import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ConversationList } from '../components/chat/ConversationList.jsx';
import { ChatWindow } from '../components/chat/ChatWindow.jsx';
import { MessageSquare, Loader2 } from 'lucide-react';

export function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const [convRes, suggRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/users/suggestions?limit=10'),
      ]);

      if (convRes.success && convRes.data) {
        setConversations(convRes.data);
        if (convRes.data.length > 0 && !activeConvId && !targetUserParam) {
          setActiveConvId(convRes.data[0].id);
        }
      }

      if (suggRes.success && suggRes.data) {
        setSuggestedUsers(suggRes.data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Handle auto-starting chat from query param ?user=...
  useEffect(() => {
    if (!targetUserParam || !user) return;

    async function startChatWithUser() {
      try {
        const res = await api.post('/messages/send', {
          recipient_id: targetUserParam,
          content: '👋 ¡Hola!',
        });
        if (res.success && res.data) {
          setActiveConvId(res.data.conversation_id);
          fetchConversations();
          setSearchParams({});
        }
      } catch (err) {
        console.error('Error auto-starting chat:', err);
      }
    }

    startChatWithUser();
  }, [targetUserParam, user]);

  const handleStartNewChat = async (targetUserId) => {
    try {
      const res = await api.post('/messages/send', {
        recipient_id: targetUserId,
        content: '👋 ¡Hola!',
      });
      if (res.success && res.data) {
        setActiveConvId(res.data.conversation_id);
        fetchConversations();
      }
    } catch (err) {
      console.error('Error starting new chat:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] md:h-screen w-full bg-white md:border-r border-slate-200/80 overflow-hidden">
      {/* Left Conversations Sidebar (hidden on mobile if chat is active) */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full ${
          activeConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => setActiveConvId(id)}
          onStartNewChat={handleStartNewChat}
          suggestedUsers={suggestedUsers}
        />
      </div>

      {/* Right Chat Room Area (hidden on mobile if no active chat) */}
      <div
        className={`flex-1 h-full ${
          !activeConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConvId ? (
          <ChatWindow
            conversationId={activeConvId}
            onBack={() => setActiveConvId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tus Mensajes Directos</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Envía mensajes privados, colabora y comparte ideas en tiempo real con otros miembros de VYBE.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
