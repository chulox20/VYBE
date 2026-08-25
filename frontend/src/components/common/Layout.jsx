import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { RightPanel } from './RightPanel.jsx';
import { Navbar } from './Navbar.jsx';
import { MobileNav } from './MobileNav.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';

export function Layout({ hideRightPanel = false }) {
  const { liveToast, setLiveToast } = useNotifications();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex justify-center">
      <div className="w-full max-w-7xl flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Center Main Content */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0">
          {/* Mobile Top Nav */}
          <Navbar />

          <main className="flex-1 flex flex-col">
            <Outlet />
          </main>
        </div>

        {/* Desktop Right Panel (if not disabled or on wide chat) */}
        {!hideRightPanel && !isChatPage && <RightPanel />}

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Floating Live Notification Toast */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3"
          >
            {liveToast.actor ? (
              <Avatar src={liveToast.actor.avatar_url} name={liveToast.actor.full_name} size="sm" />
            ) : (
              <div className="p-2 rounded-full bg-purple-600/30 text-purple-400">
                <Bell className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Nueva Notificación
              </span>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2">
                <span className="font-semibold text-white">
                  {liveToast.actor ? liveToast.actor.full_name : 'VYBE'}:
                </span>{' '}
                {liveToast.message}
              </p>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
