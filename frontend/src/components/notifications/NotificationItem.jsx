import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Tag, Mail, Sparkles, Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { formatRelativeTime } from '../../utils/formatters.jsx';

export function NotificationItem({ notification, onMarkAsRead }) {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 fill-purple-500 text-purple-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'mention':
        return <Tag className="w-4 h-4 text-amber-500" />;
      case 'message':
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.actor?.username) {
      navigate(`/profile/${notification.actor.username}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors border-b border-slate-100 last:border-none ${
        notification.is_read ? 'bg-white hover:bg-slate-50' : 'bg-purple-50/50 hover:bg-purple-50'
      }`}
    >
      <div className="relative shrink-0">
        <Avatar
          src={notification.actor?.avatar_url}
          name={notification.actor?.full_name}
          size="md"
        />
        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
          {getIcon()}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
          {notification.actor && (
            <span className="font-bold text-slate-900 mr-1 hover:text-purple-600">
              {notification.actor.full_name}
            </span>
          )}
          <span>{notification.message}</span>
        </p>

        <span className="text-[11px] text-slate-400 font-medium mt-1">
          {formatRelativeTime(notification.created_at)}
        </span>
      </div>

      {!notification.is_read && (
        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0 mt-2" />
      )}
    </div>
  );
}
