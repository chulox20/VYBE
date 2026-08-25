import React, { useState } from 'react';
import { Search, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { formatRelativeTime } from '../../utils/formatters.jsx';

export function UsersTable({ users, onUpdateStatus }) {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = users.filter((u) => {
    const q = filter.toLowerCase();
    const matchesSearch =
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Table Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, @username o email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
            <option value="banned">Bloqueados (Banned)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Registro</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                  No se encontraron usuarios con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isBanned = u.status === 'banned';
                const isSuspended = u.status === 'suspended';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{u.full_name}</span>
                        <span className="text-slate-500 text-xs">@{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'slate'} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.status === 'active'
                            ? 'success'
                            : u.status === 'suspended'
                            ? 'amber'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {formatRelativeTime(u.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status !== 'active' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onUpdateStatus(u.id, 'active')}
                            className="text-xs px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          >
                            Reactivar
                          </Button>
                        )}
                        {u.status === 'active' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onUpdateStatus(u.id, 'suspended')}
                            className="text-xs px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100"
                          >
                            Suspender
                          </Button>
                        )}
                        {u.status !== 'banned' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onUpdateStatus(u.id, 'banned')}
                            className="text-xs px-2.5 py-1"
                          >
                            Bloquear
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
