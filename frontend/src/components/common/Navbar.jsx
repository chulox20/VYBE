import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';

export function Navbar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden">
      <Link to="/feed" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          VYBE
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/search')}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100"
        >
          <Search className="w-5 h-5" />
        </button>

        <Link
          to="/notifications"
          className="relative p-2 text-slate-500 hover:text-purple-600 rounded-full hover:bg-purple-50"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {user && (
          <Link to={`/profile/${user.username}`}>
            <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}
