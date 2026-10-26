import React, { useEffect, useState } from 'react';
import { Printer, X, Monitor, QrCode, Cloud, CheckCircle2, AlertCircle, Clock, Calendar, FileText, Download } from 'lucide-react';
import { Sale } from '../types';
import { api } from '../services/api';

interface InvoicePrintModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ sale, onClose }) => {
  const [s3Doc, setS3Doc] = useState<any>(null);
  const [s3Loading, setS3Loading] = useState(true);
  const [s3Error, setS3Error] = useState(false);

  // Cargar el documento archivado en S3 para este comprobante
  useEffect(() => {
    if (!sale) return;
    setS3Loading(true);
    setS3Error(false);
    api.getDocuments()
      .then((docs: any[]) => {
        const found = docs.find(
          (d: any) =>
            d.entity_type === 'VENTAS' &&
            d.entity_id === sale.id &&
            (d.original_name?.includes(sale.sale_number) || d.filename?.includes(sale.sale_number))
        );
        setS3Doc(found || null);
      })
      .catch(() => setS3Error(true))
      .finally(() => setS3Loading(false));
  }, [sale]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // Parsear fecha y hora EXACTA del servidor (sale_date es ISO string del backend)
  const parseSaleDate = (dateStr: string): { date: string; time: string; fullISO: string } => {
    if (!dateStr) {
      const now = new Date();
      return {
        date: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        fullISO: now.toISOString(),
      };
    }
    // El backend envía la fecha en formato ISO (UTC o local), parseamos correctamente
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      fullISO: d.toISOString(),
    };
  };

  const { date: formattedDate, time: formattedTime } = parseSaleDate(sale.sale_date);

  const invoiceLabel =
    sale.status === 'COTIZACION'
      ? 'COTIZACIÓN COMERCIAL'
      : sale.status === 'PEDIDO'
      ? 'NOTA DE PEDIDO'
      : 'FACTURA ELECTRÓNICA';

  const handleDownloadS3 = () => {
    if (s3Doc?.filename) {
      const apiBase = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/v1`
        : '/api/v1';
      window.open(`${apiBase}/documents/download/${s3Doc.filename}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-8 my-8 relative flex flex-col">

        {/* ── Barra de acciones (oculta en impresión) ── */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-200 print:hidden gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-100 text-sky-800 rounded-full">
              Vista de Impresión Fiscal
            </span>

            {/* Estado Cloud S3 dinámico */}
            {s3Loading ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold border border-slate-200 animate-pulse">
                <Cloud className="w-3.5 h-3.5" />
                <span>Verificando Cloud S3…</span>
              </div>
            ) : s3Doc ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Archivada en Cloud S3</span>
                <button
                  onClick={handleDownloadS3}
                  title="Descargar copia desde Cloud S3"
                  className="ml-1 p-0.5 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ) : s3Error ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Error verificando S3</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Archivando en S3…</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Documento de Factura Imprimible ── */}
        <div className="p-2 print:p-0 font-sans" id="printable-invoice">

          {/* Encabezado: Empresa + Cuadro Fiscal */}
          <div className="flex justify-between items-start gap-6 border-b border-slate-200 pb-6 mb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-700 font-bold text-xl">
                <Monitor className="w-7 h-7 text-sky-600" />
                <span>ERP TECHSTORE S.A.C.</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Venta de Cómputo • Pantallas, Móviles, Tablets &amp; CPUs</p>
              <p className="text-xs text-slate-500">Av. Javier Prado Este 4500, San Isidro, Lima - Perú</p>
              <p className="text-xs text-slate-500">Tel: +51 (1) 619-8000 | Email: ventas@techstore.pe</p>
            </div>

            <div className="border-2 border-slate-900 rounded-2xl p-4 text-center min-w-[240px] bg-slate-50">
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase block">R.U.C. 20984719283</span>
              <div className="text-sm font-extrabold text-slate-900 my-1.5 uppercase leading-tight">
                {invoiceLabel}
              </div>
              <span className="text-sm font-mono font-bold text-sky-700 block">{sale.sale_number}</span>
            </div>
          </div>

          {/* Metadatos: Cliente + Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5 text-xs">
            {/* Columna izquierda: cliente */}
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px] mb-1.5 tracking-wider">Adquiriente / Cliente</div>
              <div className="font-bold text-slate-900 text-sm leading-tight">{sale.customer_name}</div>
              <div className="text-slate-500 mt-1 font-mono text-[11px]">
                {sale.customer_document || 'R.U.C. / D.N.I.: Registrado'}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Dir: {sale.customer_address || 'Sede Principal, Lima - Perú'}
              </div>
              <div className="text-slate-500 text-[11px]">Moneda: SOLES (S/.)</div>
            </div>

            {/* Columna derecha: fecha y hora exactas */}
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">Fecha de Emisión:</span>{' '}
                <b className="font-mono text-slate-800">{formattedDate}</b>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Clock className="w-3 h-3 text-sky-500" />
                <span className="text-slate-400">Hora Exacta:</span>{' '}
                <b className="font-mono text-sky-700 font-bold">{formattedTime}</b>
              </div>
              <div>
                <span className="text-slate-400">Condición Pago:</span>{' '}
                <b className={sale.payment_status === 'PAGADO' ? 'text-emerald-700' : 'text-amber-700'}>
                  {sale.payment_status}
                </b>
              </div>
              <div>
                <span className="text-slate-400">Almacén Despacho:</span>{' '}
                <b>{sale.warehouse_name || 'Almacén Principal Lima'}</b>
              </div>

              {/* Badge de estado S3 en la factura imprimible */}
              <div className="pt-1">
                {s3Doc ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Guardada en Cloud S3
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold rounded-full">
                    <Cloud className="w-2.5 h-2.5" />
                    Archivando en Cloud S3
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.details.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{item.product_code || `P-${item.product_id}`}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.product_name}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-sky-700">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">S/. {Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">S/. {Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pie: QR + S3 Info + Totales */}
          <div className="flex justify-between items-end gap-6 pt-2">
            {/* Izquierda: QR simulado + info S3 */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center p-1 text-slate-800 shrink-0">
                <QrCode className="w-16 h-16" />
              </div>
              <div className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                {s3Doc ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Archivada automáticamente en Cloud S3</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold mb-1">
                    <Cloud className="w-3.5 h-3.5 shrink-0" />
                    <span>Archivando en Cloud S3…</span>
                  </div>
                )}
                {s3Doc && (
                  <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="font-mono truncate">{s3Doc.original_name}</span>
                  </div>
                )}
                <div className="mt-1">
                  Factura electrónica disponible en el módulo{' '}
                  <span className="font-semibold text-slate-600">Archivos Cloud (S3)</span>.
                </div>
              </div>
            </div>

            {/* Derecha: Totales */}
            <div className="w-64 space-y-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-2xl shrink-0">
              <div className="flex justify-between">
                <span>Op. Gravadas:</span>
                <span className="font-mono font-semibold">S/. {Number(sale.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>I.G.V. (18%):</span>
                <span className="font-mono font-semibold">S/. {Number(sale.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-bold text-slate-900">
                <span>IMPORTE TOTAL:</span>
                <span className="font-mono text-sky-700">S/. {Number(sale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
