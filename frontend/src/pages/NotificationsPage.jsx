import React, { useState } from 'react';
import { Bell, CheckCheck, Filter, Heart, MessageCircle, UserPlus, Tag } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import { NotificationItem } from '../components/notifications/NotificationItem.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'likes') return n.type === 'like';
    if (activeTab === 'comments') return n.type === 'comment';
    if (activeTab === 'follows') return n.type === 'follow';
    return true;
  });

  const tabs = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'No leídas', count: unreadCount },
    { id: 'likes', label: 'Likes', icon: <Heart className="w-3.5 h-3.5 text-pink-500" /> },
    { id: 'comments', label: 'Comentarios', icon: <MessageCircle className="w-3.5 h-3.5 text-purple-600" /> },
    { id: 'follows', label: 'Seguidores', icon: <UserPlus className="w-3.5 h-3.5 text-indigo-500" /> },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm sticky top-0 md:top-4 z-20">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Notificaciones</h1>
          </div>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              leftIcon={<CheckCheck className="w-4 h-4 text-purple-600" />}
              className="text-xs font-bold"
            >
              Marcar todas leídas
            </Button>
          )}
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Notifications Stream */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-slate-300 stroke-[1.5]" />
            <span>No tienes notificaciones en este apartado.</span>
          </div>
        ) : (
          filtered.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkAsRead={markAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
