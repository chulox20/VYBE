import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, BarChart3, Users, Flag, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import { AdminStats } from '../components/admin/AdminStats.jsx';
import { UsersTable } from '../components/admin/UsersTable.jsx';
import { ReportsTable } from '../components/admin/ReportsTable.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';

export function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/reports'),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      if (reportsRes.success && reportsRes.data) setReports(reportsRes.data);
    } catch (err) {
      console.error('Error loading admin panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/feed');
      return;
    }
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, authLoading]);

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        const updatedStats = await api.get('/admin/stats');
        if (updatedStats.success) setStats(updatedStats.data);
      }
    } catch (err) {
      alert(err.message || 'Error actualizando estado de usuario');
    }
  };

  const handleResolveReport = async (reportId, resolveData) => {
    try {
      const res = await api.put(`/admin/reports/${reportId}/resolve`, resolveData);
      if (res.success) {
        await loadAdminData();
      }
    } catch (err) {
      alert(err.message || 'Error resolviendo reporte');
    }
  };

  const tabs = [
    { id: 'stats', label: 'Resumen & KPIs', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'users', label: 'Gestión de Usuarios', count: users.length, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'reports', label: 'Moderación de Contenido', count: stats?.pending_reports || 0, icon: <Flag className="w-3.5 h-3.5" /> },
  ];

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-sm sticky top-0 md:top-4 z-20 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Panel de Administración y Moderación
            </h1>
            <p className="text-xs text-slate-500">
              Supervisión de actividad de red, auditoría de reportes y control de cuentas
            </p>
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="flex flex-col gap-6">
          <AdminStats stats={stats} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <h3 className="font-extrabold text-base text-slate-900">Estado de Seguridad de la Red</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El sistema de moderación proactiva analiza reportes de spam, lenguaje inapropiado y contenido no clasificado.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  🛡️ Filtro activo
                </span>
                <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  ⚡ WebSockets online
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <h3 className="font-extrabold text-base text-slate-900">Acceso Rápido a Moderación</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hay <span className="font-bold text-amber-600">{stats?.pending_reports || 0}</span> reportes pendientes de revisión por el equipo staff.
              </p>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-purple-600 hover:text-pink-600 self-start hover:underline mt-1"
              >
                Ir a la cola de reportes →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <UsersTable users={users} onUpdateStatus={handleUpdateUserStatus} />
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <ReportsTable reports={reports} onResolveReport={handleResolveReport} />
      )}
    </div>
  );
}
