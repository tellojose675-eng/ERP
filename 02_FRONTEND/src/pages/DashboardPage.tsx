import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertOctagon,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { StockStatusBadge, StockQuantityPill } from '../components/StockStatusBadge';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error al cargar métricas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Sincronización en tiempo real entre todos los módulos
    const handleDataChanged = () => {
      fetchMetrics();
    };

    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, []);

  const handleResetAll = async () => {
    try {
      setResetting(true);
      await api.resetAllData();
      await fetchMetrics();
      setIsResetModalOpen(false);
      setToastMessage("Se vaciaron todas las transacciones, compras, ventas, kardex y saldos con éxito.");
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      alert("Error al vaciar los datos: " + (err.message || err));
    } finally {
      setResetting(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-sky-950/20 border border-slate-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Panel Ejecutivo & BI</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Dashboard Empresarial Cloud</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Métricas operativas en tiempo real, trazabilidad de compras y ventas, rotación de existencias y flujo de tesorería conectado.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>

          {/* Botón Vaciar Todo */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 border border-rose-500/30 rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all cursor-pointer text-white"
            title="Vaciar todas las operaciones y resetear el sistema"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vaciar Todo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ventas Facturadas</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              S/. {(metrics?.total_sales || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ingresos totales
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Compras */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Compras Ejecutadas</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              S/. {(metrics?.total_purchases || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Adquisiciones
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cuentas por Cobrar (CxC)</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              S/. {(metrics?.pending_receivables || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400/80 font-semibold mt-1 block">
              Saldos pendientes de cobro
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Alertas de Stock</span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {metrics?.low_stock_count || 0} ítems
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Existencias bajas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart Bars */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Evolución Comercial (Ventas vs Compras)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparativa histórica de ingresos y costos operativos</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Ventas
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400 dark:text-indigo-400">
                <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block"></span> Compras
              </span>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
            {metrics?.sales_by_month.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex justify-center items-end gap-1.5 h-44">
                  <div
                    style={{ height: `${item.ventas > 0 ? Math.max(8, Math.min(100, (item.ventas / (metrics.total_sales || 1)) * 85)) : 4}%` }}
                    className="w-1/2 bg-sky-500 rounded-t-lg hover:bg-sky-600 transition-all cursor-pointer relative group"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                      S/. {item.ventas.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{ height: `${item.compras > 0 ? Math.max(8, Math.min(100, (item.compras / (metrics.total_purchases || 1)) * 85)) : 4}%` }}
                    className="w-1/2 bg-indigo-400 dark:bg-indigo-500/70 rounded-t-lg hover:bg-indigo-500 transition-all cursor-pointer relative group"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                      S/. {item.compras.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate w-full text-center">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Alerta de Existencias</h2>
              <p className="text-xs text-slate-400">Detección de productos críticos</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {metrics?.low_stock_products.length || 0} avisos
            </span>
          </div>
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {metrics?.low_stock_products.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                Todos los productos cuentan con niveles de stock óptimos.
              </div>
            ) : (
              metrics?.low_stock_products.map((p: any) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.code}</div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <StockQuantityPill stock={p.current_stock} unit={p.unit} />
                    <StockStatusBadge stock={p.current_stock} size="sm" />
                    <span className="text-[10px] text-slate-400">Mín: {p.min_stock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Últimos Comprobantes de Venta</h2>
          <span className="text-xs text-slate-400">Actualizado automáticamente en tiempo real</span>
        </div>
        <div className="overflow-x-auto">
          {(!metrics?.recent_sales || metrics.recent_sales.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay ventas registradas aún. El sistema está limpio y listo para operar.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Importe Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics?.recent_sales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">{sale.sale_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{sale.customer_name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{sale.date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      S/. {Number(sale.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Confirmación: Vaciar Todo */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/50 max-w-lg w-full p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-4 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                  ¿Vaciar Todo el Sistema?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Acción administrativa irreversible</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 leading-relaxed mb-6 space-y-2">
              <p>Al confirmar esta operación, el sistema ejecutará un vaciado integral:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li>Se eliminarán todas las <b>Ventas y Comprobantes</b>.</li>
                <li>Se eliminarán todas las <b>Compras y Órdenes de Adquisición</b>.</li>
                <li>Se eliminarán todos los <b>Cobros y Pagos de Tesorería</b>.</li>
                <li>Se limpiará el historial de <b>Movimientos Kardex</b>.</li>
                <li>Los saldos de clientes y proveedores se reiniciarán a <b>S/. 0.00</b>.</li>
                <li>El stock de inventarios se restablecerá a <b>0 unidades</b> para iniciar en limpio.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Vaciando base de datos...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Vaciar Todo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
