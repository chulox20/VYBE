import React from 'react';
import { Users, FileText, Globe, Flag, ShieldAlert, UserCheck } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatters.jsx';

export function AdminStats({ stats }) {
  const cards = [
    {
      label: 'Usuarios Registrados',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-600',
    },
    {
      label: 'Publicaciones Creadas',
      value: stats?.total_posts || 0,
      icon: FileText,
      color: 'from-pink-500 to-rose-600',
      textColor: 'text-pink-600',
    },
    {
      label: 'Comunidades Activas',
      value: stats?.total_communities || 0,
      icon: Globe,
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600',
    },
    {
      label: 'Reportes Pendientes',
      value: stats?.pending_reports || 0,
      icon: Flag,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
    },
    {
      label: 'Usuarios Activos',
      value: stats?.active_users || 0,
      icon: UserCheck,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Cuentas Sancionadas',
      value: stats?.suspended_users || 0,
      icon: ShieldAlert,
      color: 'from-red-500 to-rose-700',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {formatCompactNumber(c.value)}
              </span>
            </div>
            <div className={`p-3 rounded-2xl bg-gradient-to-tr ${c.color} text-white shadow-md`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
