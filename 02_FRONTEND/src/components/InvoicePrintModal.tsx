import React from 'react';
import { Printer, X, Cloud, QrCode } from 'lucide-react';
import { Sale } from '../types';

interface InvoicePrintModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-8 my-8 relative flex flex-col">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-100 text-sky-800 rounded-full">
              Vista de Impresión Fiscal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="p-2 print:p-0 font-sans" id="printable-invoice">
          {/* Header */}
          <div className="flex justify-between items-start gap-6 border-b border-slate-200 pb-6 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-xl">
                <Cloud className="w-7 h-7" />
                <span>ERP ENTERPRISECLOUD S.A.C.</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Soluciones Integradas en la Nube AWS</p>
              <p className="text-xs text-slate-500">Av. Javier Prado Este 4500, San Isidro, Lima - Perú</p>
              <p className="text-xs text-slate-500">Tel: +51 (1) 619-8000 | Email: facturacion@enterprisecloud.pe</p>
            </div>

            <div className="border-2 border-slate-900 rounded-2xl p-4 text-center min-w-[240px] bg-slate-50">
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase block">R.U.C. 20984719283</span>
              <div className="text-base font-extrabold text-slate-900 my-1 uppercase">
                {sale.status === 'COTIZACION' ? 'COTIZACIÓN COMERCIAL' : 'FACTURA ELECTRÓNICA'}
              </div>
              <span className="text-sm font-mono font-bold text-sky-700 block">{sale.sale_number}</span>
            </div>
          </div>

          {/* Customer & Issue Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-xs">
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Adquiriente / Cliente</div>
              <div className="font-bold text-slate-900 text-sm">{sale.customer_name}</div>
              <div className="text-slate-500 mt-1">Dirección: Sede Principal</div>
              <div className="text-slate-500">Moneda: SOLES (S/.)</div>
            </div>
            <div className="space-y-1 text-right">
              <div><span className="text-slate-400">Fecha de Emisión:</span> <b className="font-mono">{new Date(sale.sale_date).toLocaleDateString()}</b></div>
              <div><span className="text-slate-400">Hora:</span> <span className="font-mono">{new Date(sale.sale_date).toLocaleTimeString()}</span></div>
              <div><span className="text-slate-400">Condición de Pago:</span> <b>{sale.payment_status}</b></div>
              <div><span className="text-slate-400">Almacén Despacho:</span> <b>{sale.warehouse_name || 'Almacén Central'}</b></div>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
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
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{item.product_code || `P-${item.product_id}`}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.product_name}</td>
                    <td className="py-2.5 px-3 text-center font-semibold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">S/. {item.unit_price.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">S/. {item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & QR */}
          <div className="flex justify-between items-end gap-6 pt-2">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center p-1 text-slate-800">
                <QrCode className="w-16 h-16" />
              </div>
              <div className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Representación impresa de la Factura Electrónica consultable en la plataforma cloud. Respaldo archivado en Amazon S3.
              </div>
            </div>

            <div className="w-64 space-y-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="flex justify-between">
                <span>Op. Gravadas:</span>
                <span className="font-mono font-semibold">S/. {sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>I.G.V. (18%):</span>
                <span className="font-mono font-semibold">S/. {sale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-bold text-slate-900">
                <span>IMPORTE TOTAL:</span>
                <span className="font-mono text-sky-700">S/. {sale.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
