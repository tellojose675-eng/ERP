import React, { useState } from 'react';
import {
  Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  X, Loader2, Package, Users, Factory, FileText, Sparkles,
  ArrowRight, Database, Check, ChevronRight
} from 'lucide-react';
import { api, notifyDataChanged } from '../services/api';
import { exportToCSV } from '../utils/exportToCSV';
import { parseCSVContent, readFileAsText, openCSVFileDialog } from '../utils/importFromCSV';
import { formatPeruDateTime } from '../utils/dateUtils';

export type CSVModalMode = 'import' | 'export';
export type ImportTargetType = 'AUTO' | 'PRODUCTS' | 'CUSTOMERS' | 'SUPPLIERS';

interface DashboardCSVHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: CSVModalMode;
  metrics: any;
  onDataImported?: () => void;
}

export const DashboardCSVHubModal: React.FC<DashboardCSVHubModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'import',
  metrics,
  onDataImported
}) => {
  const [mode, setMode] = useState<CSVModalMode>(initialMode);
  const [importTarget, setImportTarget] = useState<ImportTargetType>('AUTO');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [detectedType, setDetectedType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  // ── Auto-Detection Logic ───────────────────────────────────────────────────
  const detectCSVType = (headers: string[]): 'PRODUCTS' | 'CUSTOMERS' | 'SUPPLIERS' => {
    const joined = headers.map(h => h.toLowerCase()).join(' ');
    if (joined.includes('sku') || joined.includes('producto') || joined.includes('costo') || joined.includes('precioventa') || joined.includes('stockminimo')) {
      return 'PRODUCTS';
    }
    if (joined.includes('contacto') || (joined.includes('proveedor') && !joined.includes('cliente'))) {
      return 'SUPPLIERS';
    }
    if (joined.includes('cliente') || joined.includes('credito') || joined.includes('razonsocial') || joined.includes('ruc') || joined.includes('dni')) {
      return 'CUSTOMERS';
    }
    return 'PRODUCTS';
  };

  // ── File Selection ─────────────────────────────────────────────────────────
  const handleSelectFile = async () => {
    try {
      const file = await openCSVFileDialog();
      if (!file) return;
      setSelectedFile(file);
      setResultMessage(null);

      const content = await readFileAsText(file);
      const parsed = parseCSVContent(content);

      if (!parsed.success || parsed.data.length === 0) {
        setResultMessage({
          type: 'error',
          text: 'No se encontraron datos legibles en el archivo CSV.',
          details: parsed.errors
        });
        return;
      }

      setParsedHeaders(parsed.headers);
      setParsedRows(parsed.data);

      const detected = detectCSVType(parsed.headers);
      setDetectedType(detected);
      if (importTarget === 'AUTO') {
        // Will use detected type
      }
    } catch (err: any) {
      setResultMessage({ type: 'error', text: err.message || 'Error al leer el archivo CSV' });
    }
  };

  // ── Template Downloads ─────────────────────────────────────────────────────
  const downloadTemplate = (type: 'PRODUCTS' | 'CUSTOMERS' | 'SUPPLIERS') => {
    if (type === 'PRODUCTS') {
      const data = [
        {
          SKU: 'LAP-ASUS-001',
          Producto: 'Laptop Asus VivoBook 15',
          Categoria: 'Laptops & Computadoras',
          Unidad: 'UND',
          CostoUnitario: '1900',
          PrecioVenta: '2699',
          StockMinimo: '3',
          StockInicial: '8'
        },
        {
          SKU: 'IPH-16-PRO',
          Producto: 'iPhone 16 Pro 256GB Black',
          Categoria: 'Smartphones & Celulares',
          Unidad: 'UND',
          CostoUnitario: '3600',
          PrecioVenta: '4899',
          StockMinimo: '5',
          StockInicial: '12'
        },
        {
          SKU: 'MON-DELL-27',
          Producto: 'Monitor Dell 27 4K IPS',
          Categoria: 'Monitores & Pantallas',
          Unidad: 'UND',
          CostoUnitario: '1100',
          PrecioVenta: '1599',
          StockMinimo: '2',
          StockInicial: '6'
        }
      ];
      exportToCSV(data, 'plantilla_productos_erp');
    } else if (type === 'CUSTOMERS') {
      const data = [
        {
          TipoDocumento: 'RUC',
          NumeroDocumento: '20555666771',
          RazonSocial: 'Soluciones Tecnologicas SAC',
          Email: 'facturacion@soluciones.pe',
          Telefono: '01-4455667',
          Direccion: 'Av. Las Begonias 450, San Isidro, Lima',
          LimiteCredito: '45000'
        },
        {
          TipoDocumento: 'DNI',
          NumeroDocumento: '47895612',
          RazonSocial: 'Mariana Flores Rojas',
          Email: 'mariana.flores@empresa.com',
          Telefono: '988776655',
          Direccion: 'Calle Los Cedros 123, Miraflores, Lima',
          LimiteCredito: '12000'
        }
      ];
      exportToCSV(data, 'plantilla_clientes_erp');
    } else {
      const data = [
        {
          TipoDocumento: 'RUC',
          NumeroDocumento: '20199887711',
          RazonSocial: 'Distribuidora Global Tech SRL',
          Contacto: 'Juan Perez Gomez',
          Email: 'ventas@globaltech.pe',
          Telefono: '01-3344556',
          Direccion: 'Av. Industrial 890, Cercado de Lima',
          LimiteCredito: '180000'
        },
        {
          TipoDocumento: 'RUC',
          NumeroDocumento: '20443322119',
          RazonSocial: 'Importaciones Andinas SAC',
          Contacto: 'Laura Sanchez',
          Email: 'pedidos@andinasimport.pe',
          Telefono: '01-2233445',
          Direccion: 'Jr. Comercio 560, Callao',
          LimiteCredito: '150000'
        }
      ];
      exportToCSV(data, 'plantilla_proveedores_erp');
    }
  };

  // ── Import Execution ───────────────────────────────────────────────────────
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    setResultMessage(null);

    const targetType = importTarget === 'AUTO' ? (detectedType || 'PRODUCTS') : importTarget;
    let successCount = 0;
    let errorCount = 0;
    const errorsList: string[] = [];

    try {
      if (targetType === 'PRODUCTS') {
        setProgressStatus('Cargando categorías y almacenes base...');
        const [existingCats, warehouses] = await Promise.all([
          api.getCategories().catch(() => []),
          api.getWarehouses().catch(() => [])
        ]);

        const defaultWhId = warehouses.length > 0 ? warehouses[0].id : 1;
        const total = parsedRows.length;

        for (let i = 0; i < total; i++) {
          const row = parsedRows[i];
          const code = row['SKU'] || row['sku'] || row['codigo'] || row['Codigo'] || row['code'] || '';
          const name = row['Producto'] || row['producto'] || row['nombre'] || row['Nombre'] || row['name'] || '';

          if (!code || !name) {
            errorCount++;
            errorsList.push(`Fila ${i + 1}: Falta SKU o Nombre del producto`);
            continue;
          }

          // Resolver o crear categoría
          const catName = row['Categoria'] || row['categoria'] || row['category'] || 'General';
          let cat = existingCats.find((c: any) => c.name.toLowerCase() === catName.toLowerCase());
          if (!cat) {
            try {
              cat = await api.createCategory({ name: catName, description: 'Categoría importada desde CSV' });
              existingCats.push(cat);
            } catch {
              cat = existingCats[0] || { id: 1 };
            }
          }

          const unit = row['Unidad'] || row['unidad'] || row['unit'] || 'UND';
          const purchasePrice = parseFloat(row['CostoUnitario'] || row['costo'] || row['purchase_price'] || '0') || 0;
          const salePrice = parseFloat(row['PrecioVenta'] || row['precio'] || row['sale_price'] || '0') || 0;
          const minStock = parseFloat(row['StockMinimo'] || row['min_stock'] || '5') || 5;
          const initialStock = parseFloat(row['StockInicial'] || row['stock'] || row['Stock'] || row['cantidad'] || '0') || 0;

          try {
            const created = await api.createProduct({
              code,
              name,
              category_id: cat?.id || 1,
              unit,
              purchase_price: purchasePrice,
              sale_price: salePrice,
              min_stock: minStock
            });

            // Si incluye stock inicial y hay almacén, ajustar stock automáticamente
            if (initialStock > 0 && created?.id && defaultWhId) {
              await api.adjustStock({
                product_id: created.id,
                warehouse_id: defaultWhId,
                movement_type: 'ENTRADA',
                quantity: initialStock,
                notes: `Stock inicial importado desde CSV (Dashboard Central) - SKU: ${code}`
              }).catch(() => {});
            }

            successCount++;
          } catch (createErr: any) {
            errorCount++;
            errorsList.push(`Fila ${i + 1} (${code}): ${createErr.message || 'Error al registrar'}`);
          }

          setProcessingProgress(Math.round(((i + 1) / total) * 100));
          setProgressStatus(`Importando producto ${i + 1} de ${total}: ${name}`);
        }

      } else if (targetType === 'CUSTOMERS') {
        const total = parsedRows.length;
        for (let i = 0; i < total; i++) {
          const row = parsedRows[i];
          const docNumber = row['NumeroDocumento'] || row['documento'] || row['ruc'] || row['dni'] || row['Documento'] || '';
          const name = row['RazonSocial'] || row['Nombre'] || row['Cliente'] || row['name'] || '';

          if (!docNumber || !name) {
            errorCount++;
            errorsList.push(`Fila ${i + 1}: Falta número de documento o razón social`);
            continue;
          }

          const docType = (row['TipoDocumento'] || (docNumber.length === 11 ? 'RUC' : 'DNI')).toUpperCase();
          const email = row['Email'] || row['email'] || row['correo'] || '';
          const phone = row['Telefono'] || row['telefono'] || row['phone'] || '';
          const address = row['Direccion'] || row['direccion'] || '';
          const creditLimit = parseFloat(row['LimiteCredito'] || row['credito'] || row['credit_limit'] || '10000') || 10000;

          try {
            await api.createCustomer({
              document_type: docType,
              document_number: docNumber,
              name,
              email,
              phone,
              address,
              credit_limit: creditLimit
            });
            successCount++;
          } catch (custErr: any) {
            errorCount++;
            errorsList.push(`Fila ${i + 1} (${docNumber}): ${custErr.message || 'Error al registrar'}`);
          }

          setProcessingProgress(Math.round(((i + 1) / total) * 100));
          setProgressStatus(`Importando cliente ${i + 1} de ${total}: ${name}`);
        }

      } else if (targetType === 'SUPPLIERS') {
        const total = parsedRows.length;
        for (let i = 0; i < total; i++) {
          const row = parsedRows[i];
          const docNumber = row['NumeroDocumento'] || row['documento'] || row['ruc'] || row['Documento'] || '';
          const name = row['RazonSocial'] || row['Nombre'] || row['Proveedor'] || row['name'] || '';

          if (!docNumber || !name) {
            errorCount++;
            errorsList.push(`Fila ${i + 1}: Falta número de documento o razón social`);
            continue;
          }

          const docType = (row['TipoDocumento'] || 'RUC').toUpperCase();
          const contactName = row['Contacto'] || row['contacto'] || row['contact_name'] || '';
          const email = row['Email'] || row['email'] || row['correo'] || '';
          const phone = row['Telefono'] || row['telefono'] || row['phone'] || '';
          const address = row['Direccion'] || row['direccion'] || '';
          const creditLimit = parseFloat(row['LimiteCredito'] || row['credito'] || '50000') || 50000;

          try {
            await api.createSupplier({
              document_type: docType,
              document_number: docNumber,
              name,
              contact_name: contactName,
              email,
              phone,
              address,
              credit_limit: creditLimit
            });
            successCount++;
          } catch (supErr: any) {
            errorCount++;
            errorsList.push(`Fila ${i + 1} (${docNumber}): ${supErr.message || 'Error al registrar'}`);
          }

          setProcessingProgress(Math.round(((i + 1) / total) * 100));
          setProgressStatus(`Importando proveedor ${i + 1} de ${total}: ${name}`);
        }
      }

      // Notificar a todos los módulos y actualizar el Dashboard
      notifyDataChanged();
      if (onDataImported) onDataImported();

      setResultMessage({
        type: successCount > 0 ? 'success' : 'error',
        text: `Proceso completado: ${successCount} registros importados con éxito.${errorCount > 0 ? ` (${errorCount} filas omitidas o duplicadas)` : ''}`,
        details: errorsList.slice(0, 5)
      });

    } catch (globalErr: any) {
      setResultMessage({
        type: 'error',
        text: `Error durante la importación: ${globalErr.message || 'Fallo general'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Exports Execution ──────────────────────────────────────────────────────
  const handleExportDashboardExecutive = () => {
    setExportLoading('executive');
    try {
      const summaryData = [
        {
          Concepto: 'Ventas Facturadas',
          Valor: `S/. ${(metrics?.total_sales || 0).toFixed(2)}`,
          Detalle: 'Ingresos totales por comprobantes emitidos'
        },
        {
          Concepto: 'Compras Ejecutadas',
          Valor: `S/. ${(metrics?.total_purchases || 0).toFixed(2)}`,
          Detalle: 'Adquisiciones y recepciones a proveedores'
        },
        {
          Concepto: 'Cuentas por Cobrar (CxC)',
          Valor: `S/. ${(metrics?.pending_receivables || 0).toFixed(2)}`,
          Detalle: 'Saldos pendientes de cobro a clientes'
        },
        {
          Concepto: 'Alertas de Stock Crítico',
          Valor: `${metrics?.low_stock_count || 0} ítems`,
          Detalle: 'Productos con existencia menor al umbral mínimo'
        }
      ];

      // Agregar evolución mensual
      if (metrics?.sales_by_month && metrics.sales_by_month.length > 0) {
        metrics.sales_by_month.forEach((m: any) => {
          summaryData.push({
            Concepto: `Evolución Mensual (${m.month})`,
            Valor: `Ventas: S/. ${Number(m.ventas).toFixed(2)} | Compras: S/. ${Number(m.compras).toFixed(2)}`,
            Detalle: `Balance del periodo ${m.month}`
          });
        });
      }

      exportToCSV(summaryData, 'resumen_ejecutivo_dashboard');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportProducts = async () => {
    setExportLoading('products');
    try {
      const products = await api.getProducts();
      const exportData = products.map((p: any) => ({
        SKU: p.code,
        Producto: p.name,
        Categoria: p.category?.name || 'General',
        Unidad: p.unit,
        CostoUnitario: p.purchase_price,
        PrecioVenta: p.sale_price,
        StockMinimo: p.min_stock,
        StockTotal: p.total_stock || 0,
        ValorizadoInventario: ((p.total_stock || 0) * p.purchase_price).toFixed(2)
      }));
      exportToCSV(exportData, 'catalogo_productos_completo');
    } catch (err: any) {
      alert('Error al exportar productos: ' + err.message);
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportCustomers = async () => {
    setExportLoading('customers');
    try {
      const customers = await api.getCustomers();
      const exportData = customers.map((c: any) => ({
        TipoDocumento: c.document_type,
        NumeroDocumento: c.document_number,
        RazonSocial: c.name,
        Email: c.email || '-',
        Telefono: c.phone || '-',
        Direccion: c.address || '-',
        SaldoDeuda: c.current_debt || 0,
        LimiteCredito: c.credit_limit || 0
      }));
      exportToCSV(exportData, 'directorio_clientes');
    } catch (err: any) {
      alert('Error al exportar clientes: ' + err.message);
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportSuppliers = async () => {
    setExportLoading('suppliers');
    try {
      const suppliers = await api.getSuppliers();
      const exportData = suppliers.map((s: any) => ({
        TipoDocumento: s.document_type,
        NumeroDocumento: s.document_number,
        RazonSocial: s.name,
        Contacto: s.contact_name || '-',
        Email: s.email || '-',
        Telefono: s.phone || '-',
        Direccion: s.address || '-',
        SaldoPorPagar: s.current_debt || 0,
        LimiteCredito: s.credit_limit || 0
      }));
      exportToCSV(exportData, 'directorio_proveedores');
    } catch (err: any) {
      alert('Error al exportar proveedores: ' + err.message);
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportSales = async () => {
    setExportLoading('sales');
    try {
      const sales = await api.getSales();
      const exportData = sales.map((sale: any) => ({
        Comprobante: sale.sale_number,
        Cliente: sale.customer?.name || sale.customer_name || '-',
        FechaEmision: formatPeruDateTime(sale.issue_date || sale.created_at),
        Estado: sale.status,
        Subtotal: sale.subtotal,
        IGV: sale.tax,
        Total: sale.total,
        Notas: sale.notes || '-'
      }));
      exportToCSV(exportData, 'historial_ventas_facturacion');
    } catch (err: any) {
      alert('Error al exportar ventas: ' + err.message);
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-sky-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/25">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Centro de Datos CSV — Dashboard Central
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Importa o exporta datos masivos con sincronización instantánea en todos los módulos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-1.5 gap-1.5">
          <button
            onClick={() => setMode('import')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'import'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar CSV al Sistema</span>
          </button>
          <button
            onClick={() => setMode('export')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'export'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar Reportes CSV</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {mode === 'import' ? (
            /* ══════════════════════════════════════════════════════════════
               IMPORT TAB
            ══════════════════════════════════════════════════════════════ */
            <div className="space-y-5">
              
              {/* Target Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  1. Selecciona el Tipo de Datos a Cargar:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportTarget('AUTO')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTarget === 'AUTO'
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sparkles className="w-4 h-4 text-sky-500" />
                      {importTarget === 'AUTO' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold">Auto-Detectar</div>
                      <div className="text-[10px] text-slate-400">Por cabeceras</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportTarget('PRODUCTS')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTarget === 'PRODUCTS'
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Package className="w-4 h-4 text-indigo-500" />
                      {importTarget === 'PRODUCTS' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold">Productos</div>
                      <div className="text-[10px] text-slate-400">Catálogo e Stock</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportTarget('CUSTOMERS')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTarget === 'CUSTOMERS'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Users className="w-4 h-4 text-emerald-500" />
                      {importTarget === 'CUSTOMERS' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold">Clientes</div>
                      <div className="text-[10px] text-slate-400">RUC, DNI, Crédito</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportTarget('SUPPLIERS')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTarget === 'SUPPLIERS'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Factory className="w-4 h-4 text-amber-500" />
                      {importTarget === 'SUPPLIERS' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold">Proveedores</div>
                      <div className="text-[10px] text-slate-400">Compras y pagos</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Plantillas de Ejemplo */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Database className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>¿Necesitas una plantilla de ejemplo para Excel / CSV?</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => downloadTemplate('PRODUCTS')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 transition-colors shadow-2xs"
                  >
                    Plantilla Productos
                  </button>
                  <button
                    onClick={() => downloadTemplate('CUSTOMERS')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs"
                  >
                    Plantilla Clientes
                  </button>
                  <button
                    onClick={() => downloadTemplate('SUPPLIERS')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-2xs"
                  >
                    Plantilla Proveedores
                  </button>
                </div>
              </div>

              {/* File Selector Box */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  2. Carga tu archivo CSV:
                </label>
                <div
                  onClick={handleSelectFile}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/40 dark:bg-slate-800/20 group"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile ? selectedFile.name : 'Haz clic para seleccionar tu archivo CSV'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Soporta delimitadores con punto y coma (;) o comas (,) codificado en UTF-8 o Windows-1252.
                  </p>
                </div>
              </div>

              {/* File Preview */}
              {parsedRows.length > 0 && (
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {parsedRows.length} registros detectados
                      {detectedType && (
                        <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-200 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 font-semibold uppercase">
                          Tipo: {detectedType}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Columnas: {parsedHeaders.slice(0, 4).join(', ')}...
                    </span>
                  </div>

                  {/* Mini Preview Table */}
                  <div className="overflow-x-auto max-h-36 rounded-xl border border-sky-200/60 dark:border-sky-900/40 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                        <tr>
                          {parsedHeaders.slice(0, 5).map((h, i) => (
                            <th key={i} className="py-2 px-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.slice(0, 3).map((row, i) => (
                          <tr key={i}>
                            {parsedHeaders.slice(0, 5).map((h, j) => (
                              <td key={j} className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                    ⚡ Al confirmar, los registros se insertarán en la base de datos y se actualizarán inmediatamente las existencias, ventas y métricas del dashboard.
                  </p>
                </div>
              )}

              {/* Progress Bar during execution */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                      {progressStatus}
                    </span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result Message */}
              {resultMessage && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1 ${
                    resultMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {resultMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    {resultMessage.text}
                  </div>
                  {resultMessage.details && resultMessage.details.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] opacity-80 mt-1 space-y-0.5">
                      {resultMessage.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0 || isProcessing}
                  onClick={handleExecuteImport}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Importar {parsedRows.length > 0 ? `(${parsedRows.length} registros)` : ''}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               EXPORT TAB
            ══════════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona el reporte consolidado que deseas descargar en formato CSV compatible con Microsoft Excel:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Resumen Ejecutivo */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Resumen Ejecutivo Dashboard</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Métricas clave, ventas totales, compras, cuentas por cobrar y balance mensual.
                    </p>
                  </div>
                  <button
                    onClick={handleExportDashboardExecutive}
                    disabled={exportLoading !== null}
                    className="w-full py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {exportLoading === 'executive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Descargar CSV</span>
                  </button>
                </div>

                {/* 2. Catálogo de Productos */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                      <Package className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Catálogo de Productos &amp; Stock</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      SKUs, precios de venta, costos de compra, stock total y valorización de inventario.
                    </p>
                  </div>
                  <button
                    onClick={handleExportProducts}
                    disabled={exportLoading !== null}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {exportLoading === 'products' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Descargar CSV</span>
                  </button>
                </div>

                {/* 3. Directorio de Clientes */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Directorio de Clientes</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Razón social, RUC/DNI, teléfonos, correos y saldos de cuentas por cobrar.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCustomers}
                    disabled={exportLoading !== null}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {exportLoading === 'customers' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Descargar CSV</span>
                  </button>
                </div>

                {/* 4. Proveedores */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                      <Factory className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Directorio de Proveedores</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Proveedores comerciales, contactos, saldos por pagar y líneas de crédito.
                    </p>
                  </div>
                  <button
                    onClick={handleExportSuppliers}
                    disabled={exportLoading !== null}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {exportLoading === 'suppliers' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Descargar CSV</span>
                  </button>
                </div>

                {/* 5. Historial de Ventas */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 sm:col-span-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">Historial de Ventas &amp; Facturación</h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Comprobantes emitidos, estado de facturación, desglose de IGV y montos totales.
                      </p>
                    </div>
                    <button
                      onClick={handleExportSales}
                      disabled={exportLoading !== null}
                      className="py-2.5 px-4 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 text-violet-700 dark:text-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-4"
                    >
                      {exportLoading === 'sales' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Descargar CSV Ventas</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
