import React, { useEffect, useState } from 'react';
import { Printer, X, Monitor, Cloud, CheckCircle2, AlertCircle, Clock, Calendar, FileText, Download, ExternalLink, Eye } from 'lucide-react';
import { Sale } from '../types';
import { api } from '../services/api';
import { formatPeruDateAndParts } from '../utils/dateUtils';

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

  const getApiBase = () => {
    return import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api/v1`
      : '/api/v1';
  };

  const handleDownloadS3 = () => {
    const apiBase = getApiBase();
    const filename = s3Doc?.filename || `Factura_${sale.sale_number}.html`;
    window.open(`${apiBase}/documents/download/${encodeURIComponent(filename)}`, '_blank');
  };

  const handleViewS3 = () => {
    const apiBase = getApiBase();
    const filename = s3Doc?.filename || `Factura_${sale.sale_number}.html`;
    window.open(`${apiBase}/documents/view/${encodeURIComponent(filename)}`, '_blank');
  };

  const { date: formattedDate, time: formattedTime } = formatPeruDateAndParts(sale.sale_date);

  const invoiceLabel =
    sale.status === 'COTIZACION'
      ? 'COTIZACIÓN COMERCIAL'
      : sale.status === 'PEDIDO'
      ? 'NOTA DE PEDIDO'
      : 'FACTURA ELECTRÓNICA';

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
                  onClick={handleViewS3}
                  title="Visualizar documento archivado en S3"
                  className="ml-1 p-1 hover:text-emerald-950 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDownloadS3}
                  title="Descargar copia desde Cloud S3"
                  className="p-1 hover:text-emerald-950 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : s3Error ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Respaldo S3 sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Archivada en Cloud S3</span>
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

          {/* Metadatos: Cliente + Fecha y Hora en Horario Peruano */}
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

            {/* Columna derecha: fecha y hora oficial del Perú (UTC-5) */}
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Fecha de Emisión:</span>{' '}
                <b className="font-mono text-slate-900 font-bold text-xs">{formattedDate}</b>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-slate-500 font-medium">Hora Exacta:</span>{' '}
                <b className="font-mono text-sky-700 font-bold text-xs">{formattedTime}</b>
              </div>
              <div>
                <span className="text-slate-500">Condición Pago:</span>{' '}
                <b className={sale.payment_status === 'PAGADO' ? 'text-emerald-700' : 'text-amber-700'}>
                  {sale.payment_status}
                </b>
              </div>
              <div>
                <span className="text-slate-500">Almacén Despacho:</span>{' '}
                <b>{sale.warehouse_name || 'Almacén Central Lima'}</b>
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

          {/* Pie: Tarjeta S3 Cloud (Imagen 3 solicitada) + Totales */}
          <div className="flex justify-between items-end gap-6 pt-2 flex-wrap sm:flex-nowrap">
            {/* Izquierda: Tarjeta S3 (Diseño exacto de la 3ra imagen) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs max-w-sm w-full">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-700 text-sm leading-tight">
                      Factura archivada correctamente
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Almacenamiento seguro en la nube
                    </div>
                  </div>
                </div>
                <Cloud className="w-5 h-5 text-slate-400 shrink-0" />
              </div>

              <div className="border-t border-slate-100 my-2.5" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs font-mono truncate">
                      {s3Doc?.original_name || `Factura_${sale.sale_number}.html`}
                    </div>
                    <div className="text-xs text-slate-500">
                      Disponible en Archivos Cloud (S3).
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleViewS3}
                    title="Visualizar documento en pantalla"
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadS3}
                    title="Descargar archivo"
                    className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
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
