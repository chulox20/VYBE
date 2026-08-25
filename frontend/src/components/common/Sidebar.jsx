import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Users,
  MessageSquare,
  Bell,
  Bookmark,
  User,
  ShieldAlert,
  PlusCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { CreatePostModal } from '../feed/CreatePostModal.jsx';

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navItems = [
    { label: 'Inicio', path: '/feed', icon: Home },
    { label: 'Explorar', path: '/explore', icon: Compass },
    { label: 'Comunidades', path: '/communities', icon: Users },
    { label: 'Mensajes', path: '/messages', icon: MessageSquare },
    { label: 'Notificaciones', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Guardados', path: '/saved', icon: Bookmark },
    { label: 'Mi Perfil', path: user ? `/profile/${user.username}` : '/login', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Panel Admin', path: '/admin', icon: ShieldAlert, isAdmin: true });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="sticky top-0 h-screen w-64 xl:w-72 flex flex-col justify-between p-4 sm:p-6 border-r border-slate-200/80 bg-white/70 backdrop-blur-md shrink-0 hidden md:flex z-30">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <NavLink to="/feed" className="flex items-center gap-2.5 px-3 py-1 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-purple-700 to-pink-500 bg-clip-text text-transparent">
                VYBE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Social Network
              </span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 shadow-sm shadow-purple-500/5'
                        : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-pink-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Create Post Button */}
          {user && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-purple-500/25 py-3"
              leftIcon={<PlusCircle className="w-5 h-5" />}
            >
              Publicar
            </Button>
          )}
        </div>

        {/* User Profile Pill at Bottom */}
        {user ? (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <NavLink
              to={`/profile/${user.username}`}
              className="flex items-center gap-3 overflow-hidden group flex-1"
            >
              <Avatar
                src={user.avatar_url}
                name={user.full_name}
                size="md"
                className="group-hover:ring-2 ring-purple-500 ring-offset-2 transition-all"
              />
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                  {user.full_name}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  @{user.username}
                </span>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              size="md"
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </div>
        )}
      </aside>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
