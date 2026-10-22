import React, { useEffect, useState } from 'react';
import { Shield, Search, CheckCircle, XCircle, Download } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { exportToCSV } from '../utils/exportToCSV';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(selectedModule || undefined);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleDataChanged = () => {
      loadLogs();
    };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, [selectedModule]);

  const handleExportCSV = () => {
    const exportData = filtered.map(l => ({
      FechaHora: new Date(l.created_at).toLocaleString(),
      Usuario: l.username || 'Sistema',
      Modulo: l.module,
      Accion: l.action,
      RegistroID: l.record_id || '',
      Detalles: l.details || '',
      Resultado: l.status
    }));
    exportToCSV(exportData, 'pistas_auditoria_sistema');
  };

  const filtered = logs.filter(l =>
    (l.username && l.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Auditoría & Trazabilidad Inmutable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro estricto de eventos de seguridad, operaciones transaccionales y modificaciones en el sistema.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Exportar Pistas CSV</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Filtrar por Módulo:</span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          >
            <option value="">Todos los módulos</option>
            <option value="AUTH">Autenticación (AUTH)</option>
            <option value="VENTAS">Ventas</option>
            <option value="COMPRAS">Compras</option>
            <option value="INVENTARIO">Inventario & Kardex</option>
            <option value="FINANZAS">Finanzas</option>
            <option value="DOCUMENTOS">Documentos Cloud</option>
            <option value="PRODUCTOS">Catálogo</option>
            <option value="USUARIOS">Usuarios e IAM</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Fecha y Hora</th>
              <th className="py-3.5 px-4">Usuario</th>
              <th className="py-3.5 px-4">Módulo</th>
              <th className="py-3.5 px-4">Acción Realizada</th>
              <th className="py-3.5 px-4">ID Afectado</th>
              <th className="py-3.5 px-4">Detalles de Operación</th>
              <th className="py-3.5 px-4 text-center">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-sans">{new Date(l.created_at).toLocaleString()}</td>
                <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">{l.username || 'Sistema'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {l.module}
                  </span>
                </td>
                <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-slate-100">{l.action}</td>
                <td className="py-3 px-4 text-slate-400">{l.record_id || '-'}</td>
                <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-sm truncate">{l.details}</td>
                <td className="py-3 px-4 text-center font-sans">
                  {l.status === 'EXITOSO' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3" /> Exitoso
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-3 h-3" /> Fallido
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
