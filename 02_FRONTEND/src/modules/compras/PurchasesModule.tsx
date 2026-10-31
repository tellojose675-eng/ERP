import React, { useEffect, useState } from 'react';
import { Plus, Eye, Ban, Search, Download, Trash2, AlertTriangle, X, Upload, PackageOpen, ShoppingBag, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { Purchase, Supplier, Product, Warehouse } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';
import { importCSVFlow } from '../../utils/importFromCSV';
import { StockStatusBadge, StockQuantityPill } from '../../components/StockStatusBadge';
import { formatPeruDate, formatPeruDateTime } from '../../utils/dateUtils';

type PurchaseMode = 'normal' | 'low_stock';

export const PurchasesModule: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODAS');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Modo de compra
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('normal');
  const [productSearch, setProductSearch] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Form
  const [supplierId, setSupplierId] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [status, setStatus] = useState<string>('RECIBIDA');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<{ product_id: number; quantity: number; unit_price: number }[]>([
    { product_id: 0, quantity: 1, unit_price: 0 }
  ]);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);

  const loadWarehouseStock = async (whId: number) => {
    try {
      const stockData = await api.getStock(whId);
      setWarehouseStock(stockData);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesData, suppliersData, productsData, warehousesData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
        api.getWarehouses()
      ]);
      setPurchases(purchasesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setWarehouses(warehousesData);
      if (suppliersData.length > 0 && supplierId === 0) setSupplierId(suppliersData[0].id);
      const initialWh = warehousesData.length > 0 ? warehousesData[0].id : 1;
      if (warehouseId === 1 && warehousesData.length > 0) {
        setWarehouseId(initialWh);
        loadWarehouseStock(initialWh);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataChanged = () => {
      loadData();
      if (warehouseId) loadWarehouseStock(warehouseId);
    };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, [warehouseId]);

  // Límite de compra por unidad: respeta min_stock o cupo de 5 unidades
  const getProductLimit = (pId: number): number => {
    if (!pId) return 5;
    const prod = products.find(p => p.id === pId);
    return prod?.min_stock ? Math.max(5, Math.round(prod.min_stock)) : 5;
  };

  const handleProductSelect = (index: number, pId: number) => {
    const prod = products.find(p => p.id === pId);
    const newItems = [...items];
    newItems[index].product_id = pId;
    if (prod) {
      newItems[index].unit_price = prod.purchase_price;
      const limit = getProductLimit(pId);
      if (newItems[index].quantity > limit) {
        newItems[index].quantity = limit;
      }
    }
    setItems(newItems);
    setStockWarning(null);
  };

  const incrementQty = (index: number) => {
    const item = items[index];
    if (!item.product_id) {
      setStockWarning("Por favor selecciona primero un producto.");
      return;
    }
    const limit = getProductLimit(item.product_id);
    if (item.quantity >= limit) {
      setStockWarning(`⚠️ Ya no hay más producto en stock, está agotado (Límite máximo por orden: ${limit} unidades).`);
      setTimeout(() => setStockWarning(null), 4000);
      return;
    }
    setStockWarning(null);
    const newItems = [...items];
    newItems[index].quantity += 1;
    setItems(newItems);
  };

  const decrementQty = (index: number) => {
    const newItems = [...items];
    if (newItems[index].quantity > 1) {
      newItems[index].quantity -= 1;
      setItems(newItems);
      setStockWarning(null);
    }
  };

  const handleQtyChange = (index: number, val: number) => {
    const item = items[index];
    if (!item.product_id) return;
    const limit = getProductLimit(item.product_id);
    let finalVal = val;
    if (val > limit) {
      setStockWarning(`⚠️ Ya no hay más producto en stock, está agotado (Límite máximo: ${limit} unidades).`);
      setTimeout(() => setStockWarning(null), 4000);
      finalVal = limit;
    } else {
      setStockWarning(null);
    }
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, finalVal);
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { product_id: 0, quantity: 1, unit_price: 0 }]);
    setStockWarning(null);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setStockWarning(null);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
    const tax = subtotal * 0.18;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100
    };
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.product_id > 0);
    if (validItems.length === 0) {
      alert("Debes agregar al menos un producto a la orden.");
      return;
    }

    try {
      await api.createPurchase({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        status,
        notes,
        items: validItems
      });
      setIsCreateOpen(false);
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
      setNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al registrar orden de compra');
    }
  };

  const handleCancelPurchase = async (id: number) => {
    if (confirm('¿Está seguro de anular esta compra? Se ajustará el inventario recibido.')) {
      try {
        await api.cancelPurchase(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Error al anular compra');
      }
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredPurchases.map(p => ({
      NumeroOrden: p.purchase_number,
      Proveedor: p.supplier_name,
      Fecha: formatPeruDate(p.purchase_date),
      Estado: p.status,
      CondicionPago: p.payment_status,
      Subtotal: p.subtotal,
      IGV_18: p.tax,
      Total: p.total
    }));
    exportToCSV(exportData, 'compras_proveedores');
  };

  const handleImportCSV = async () => {
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await importCSVFlow();
      if (!result) { setImportLoading(false); return; }
      if (!result.success) {
        setImportResult(`❌ ${result.errors.join(', ')}`);
        setImportLoading(false);
        return;
      }
      setImportResult(`✅ ${result.rowCount} filas leídas del CSV. Revisa los datos e importa manualmente.`);
    } catch (err: any) {
      setImportResult(`❌ Error: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  /** Activa el modo "Compra por Menor Stock" y precarga los productos críticos */
  const handleOpenLowStockMode = () => {
    const lowStockProds = products
      .filter(p => (p.total_stock ?? 0) <= (p.min_stock ?? 0) && p.min_stock > 0)
      .slice(0, 10);
    if (lowStockProds.length === 0) {
      alert('¡Todos los productos tienen stock suficiente en este momento!');
      return;
    }
    // Precarga los ítems con cantidades sugeridas
    const preloaded = lowStockProds.map(p => ({
      product_id: p.id,
      quantity: Math.max(1, Math.ceil((p.min_stock ?? 5) * 1.5)),
      unit_price: p.purchase_price
    }));
    setItems(preloaded);
    setPurchaseMode('low_stock');
    setStockWarning(null);
    setIsCreateOpen(true);
  };

  // Productos filtrados por búsqueda en modal
  const filteredProductsForModal = products.filter(p =>
    !productSearch ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'TODAS' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals();
  const lowStockCount = products.filter(p => (p.total_stock ?? 0) <= (p.min_stock ?? 0) && p.min_stock > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Compras & Adquisiciones</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Órdenes de compra a mayoristas, recepción en almacén y cuentas por pagar.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleImportCSV}
            disabled={importLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-4 h-4 text-sky-600" />
            <span>{importLoading ? 'Leyendo...' : 'Importar CSV'}</span>
          </button>
          {/* Botón Compra por Menor Stock */}
          <button
            onClick={handleOpenLowStockMode}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-500/30 transition-all cursor-pointer"
            title={`${lowStockCount} productos con stock crítico`}
          >
            <PackageOpen className="w-4 h-4" />
            <span>Bajo Stock</span>
            {lowStockCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>
          {/* Botón Compra Normal */}
          <button
            onClick={() => {
              setPurchaseMode('normal');
              setStockWarning(null);
              setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
              setProductSearch('');
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Compra Normal</span>
          </button>
        </div>
      </div>

      {/* Resultado importación */}
      {importResult && (
        <div className={`p-3 rounded-xl text-xs font-semibold border ${
          importResult.startsWith('✅')
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {importResult}
          <button onClick={() => setImportResult(null)} className="ml-4 underline opacity-70 hover:opacity-100">Cerrar</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por número o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['TODAS', 'RECIBIDA', 'ORDEN', 'SOLICITUD', 'ANULADA'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-4">N° Orden</th>
                <th className="p-4">Proveedor</th>
                <th className="p-4">Almacén Destino</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Condición Pago</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Cargando órdenes de compra...</td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No se encontraron adquisiciones registradas.</td>
                </tr>
              ) : filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{purchase.purchase_number}</td>
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{purchase.supplier_name}</td>
                  <td className="p-4">{purchase.warehouse_name}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatPeruDate(purchase.purchase_date)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      purchase.status === 'RECIBIDA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      purchase.status === 'ORDEN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' :
                      purchase.status === 'ANULADA' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      purchase.payment_status === 'PAGADO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {purchase.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    S/. {Number(purchase.total).toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        title="Ver Ítems Adquiridos"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {purchase.status !== 'ANULADA' && (
                        <button
                          onClick={() => handleCancelPurchase(purchase.id)}
                          title="Anular Compra"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setPurchaseMode('normal'); }}
        title={purchaseMode === 'low_stock'
          ? '🟠 Compra por Productos de Menor Stock'
          : '🛒 Nueva Orden de Compra Normal'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          {/* Banner de modo bajo stock */}
          {purchaseMode === 'low_stock' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>Modo: Compra por Bajo Stock.</b> Se han preseleccionado los {items.length} productos
                con stock igual o menor al mínimo. Puedes ajustar cantidades antes de confirmar.
              </span>
            </div>
          )}
          {/* Alerta de Stock / Límite */}
          {stockWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{stockWarning}</span>
              </div>
              <button type="button" onClick={() => setStockWarning(null)} className="text-amber-700 hover:text-amber-900 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Buscador de productos (solo modo normal) */}
          {purchaseMode === 'normal' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filtrar productos al seleccionar en la orden..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Proveedor</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.document_number})</option>
                ))}
              </select>
              {(() => {
                const selSupp = suppliers.find(s => s.id === supplierId);
                return selSupp ? (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 block">
                    Saldo adeudado (CxP): S/. {Number(selSupp.current_balance || 0).toFixed(2)}
                  </span>
                ) : null;
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Almacén Destino</label>
              <select
                required
                value={warehouseId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setWarehouseId(val);
                  loadWarehouseStock(val);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado Recepción</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="RECIBIDA">Recibida (Ingresa a Stock Kardex)</option>
                <option value="ORDEN">Orden Emitida (Pendiente)</option>
                <option value="SOLICITUD">Solicitud de Cotización</option>
              </select>
            </div>
          </div>

          {/* Tabla de Productos Múltiples */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Productos de la Orden ({items.length} {items.length === 1 ? 'producto' : 'productos'})
                </span>
                <p className="text-[11px] text-slate-400">Puedes agregar todos los productos que necesites en una sola compra.</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Otro Producto</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const limit = getProductLimit(item.product_id);
                const isMax = item.product_id > 0 && item.quantity >= limit;

                return (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center gap-3">
                    {/* Selector de Producto */}
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Producto #{idx + 1}</label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => handleProductSelect(idx, Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value={0}>-- Seleccionar Producto del Catálogo --</option>
                        {(purchaseMode === 'normal' ? filteredProductsForModal : products).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} [Stock Actual: {p.total_stock ?? 0} {p.unit || 'UND'}] (Costo: S/. {Number(p.purchase_price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                      {item.product_id > 0 && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {(() => {
                            const prod = products.find(p => p.id === item.product_id);
                            const currentStock = prod?.total_stock ?? 0;
                            return (
                              <>
                                <StockQuantityPill stock={currentStock} unit={prod?.unit || 'UND'} />
                                <StockStatusBadge stock={currentStock} size="sm" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Límite por compra: <b className="text-slate-700 dark:text-slate-200">{limit} UND</b>
                                </span>
                              </>
                            );
                          })()}
                          {isMax && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              (Límite alcanzado)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stepper Cantidad [-] [Qty] [+] */}
                    <div className="w-full md:w-36">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Cantidad</label>
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => decrementQty(idx)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs disabled:opacity-40 cursor-pointer"
                          title="Restar 1 unidad"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={limit}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                          className="w-full text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => incrementQty(idx)}
                          className={`px-3 py-2 font-bold text-xs cursor-pointer transition-colors ${
                            isMax
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                          title={isMax ? 'Límite máximo alcanzado' : 'Añadir 1 unidad'}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Costo Unitario */}
                    <div className="w-full md:w-32">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Costo Unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].unit_price = Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono text-right"
                      />
                    </div>

                    {/* Subtotal Línea */}
                    <div className="w-full md:w-28 text-right">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Subtotal</label>
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white pt-2">
                        S/. {(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>

                    {/* Eliminar Fila */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        title="Eliminar este producto"
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen Totales de la Orden */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-100 dark:bg-slate-800/90 p-4 rounded-2xl gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Total de Ítems en la Orden: <b>{items.reduce((acc, i) => acc + (i.product_id > 0 ? i.quantity : 0), 0)} unidades</b>
              </span>
              <div className="flex items-center gap-6">
                <span className="text-slate-600 dark:text-slate-300">Subtotal: <b>S/. {totals.subtotal.toFixed(2)}</b></span>
                <span className="text-slate-600 dark:text-slate-300">IGV (18%): <b>S/. {totals.tax.toFixed(2)}</b></span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  Total: S/. {totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas / Observaciones</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Orden mayorista entrega en almacén principal"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all ${
                purchaseMode === 'low_stock'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {purchaseMode === 'low_stock' ? '📦 Confirmar Reabastecimiento' : 'Confirmar Adquisición'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalle */}
      {selectedPurchase && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPurchase(null)}
          title={`Detalle de Orden de Compra: ${selectedPurchase.purchase_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <div>
                <span className="text-slate-400 block">Proveedor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{selectedPurchase.supplier_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fecha y Hora:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPeruDateTime(selectedPurchase.purchase_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Almacén Recepción:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPurchase.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Estado Operativo:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedPurchase.status}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Productos Recibidos</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[460px] sm:min-w-0">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Costo Unit.</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedPurchase.details?.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{d.product_code || `P-${d.product_id}`}</td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{d.product_name || `Producto ${d.product_id}`}</td>
                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{d.quantity}</td>
                        <td className="p-3 text-right font-mono">S/. {Number(d.unit_price).toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-semibold">S/. {Number(d.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-6 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <span>Subtotal: S/. {Number(selectedPurchase.subtotal).toFixed(2)}</span>
              <span>IGV (18%): S/. {Number(selectedPurchase.tax).toFixed(2)}</span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                Total: S/. {Number(selectedPurchase.total).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
