import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Users, MessageSquare, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

export function MobileNav() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    { label: 'Inicio', path: '/feed', icon: Home },
    { label: 'Explorar', path: '/explore', icon: Compass },
    { label: 'Comunidades', path: '/communities', icon: Users },
    { label: 'Mensajes', path: '/messages', icon: MessageSquare },
    { label: 'Notifs', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Perfil', path: user ? `/profile/${user.username}` : '/login', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200 md:hidden px-2 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? 'text-purple-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
