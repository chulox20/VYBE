import React, { useState } from 'react';
import { Flag, CheckCircle, XCircle, Trash2, ShieldAlert } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';
import { formatRelativeTime } from '../../utils/formatters.jsx';

export function ReportsTable({ reports, onResolveReport }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveAction, setResolveAction] = useState('none');
  const [resolveNotes, setResolveNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = reports.filter((r) => {
    return statusFilter === 'all' || r.status === statusFilter;
  });

  const handleOpenResolve = (report) => {
    setSelectedReport(report);
    setResolveAction('none');
    setResolveNotes(report.notes || '');
  };

  const handleSubmitResolve = async (status) => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      await onResolveReport(selectedReport.id, {
        status,
        notes: resolveNotes,
        action: resolveAction,
      });
      setSelectedReport(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {/* Header with filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900">Cola de Reportes de Contenido</h3>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="resolved">Resueltos</option>
            <option value="dismissed">Descartados</option>
          </select>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Reportado Por</th>
                <th className="py-3 px-4">Tipo / ID Objetivo</th>
                <th className="py-3 px-4">Motivo del Reporte</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No hay reportes que requieran atención en esta categoría.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                      <Avatar src={r.reporter?.avatar_url} name={r.reporter?.full_name} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{r.reporter?.full_name}</span>
                        <span className="text-slate-400 text-[11px]">@{r.reporter?.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="purple" size="sm">
                        {r.target_type}
                      </Badge>
                      <span className="text-[11px] text-slate-400 block font-mono mt-0.5">{r.target_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs">
                      {r.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {formatRelativeTime(r.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.status === 'pending'
                            ? 'amber'
                            : r.status === 'resolved'
                            ? 'success'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenResolve(r)}
                        className="text-xs px-3 py-1"
                      >
                        Revisar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Report Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="Moderar Contenido Reportado"
      >
        {selectedReport && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500 uppercase">Objetivo:</span>
                <Badge variant="purple" size="sm">{selectedReport.target_type}</Badge>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Motivo:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{selectedReport.reason}</p>
              </div>
              {selectedReport.notes && (
                <div>
                  <span className="font-bold text-slate-500 uppercase">Detalles:</span>
                  <p className="text-slate-600 mt-0.5">{selectedReport.notes}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Acción Disciplinaria Automática
              </label>
              <select
                value={resolveAction}
                onChange={(e) => setResolveAction(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
              >
                <option value="none">Sin sanción (Solo cerrar reporte)</option>
                <option value="delete_content">🗑️ Eliminar contenido reportado</option>
                <option value="suspend_user">⚠️ Suspender usuario temporalmente</option>
                <option value="ban_user">🚫 Bloquear usuario permanentemente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Notas del Moderador
              </label>
              <textarea
                rows={2}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Añade notas internas de moderación..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSubmitResolve('dismissed')}
                disabled={isSubmitting}
              >
                Descartar Reporte
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={() => handleSubmitResolve('resolved')}
              >
                Resolver & Aplicar Acción
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
