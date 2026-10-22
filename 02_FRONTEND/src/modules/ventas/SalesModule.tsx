import React, { useEffect, useState } from 'react';
import { Plus, Eye, Ban, Search, Download, Printer, Filter, Trash2, AlertTriangle, X } from 'lucide-react';
import { api } from '../../services/api';
import { Sale, Customer, Product, Warehouse } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';
import { InvoicePrintModal } from '../../components/InvoicePrintModal';
import { StockStatusBadge, StockQuantityPill } from '../../components/StockStatusBadge';

export const SalesModule: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [status, setStatus] = useState<string>('FACTURADA');
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
      const [salesData, customersData, productsData, warehousesData] = await Promise.all([
        api.getSales(),
        api.getCustomers(),
        api.getProducts(),
        api.getWarehouses()
      ]);
      setSales(salesData);
      setCustomers(customersData);
      setProducts(productsData);
      setWarehouses(warehousesData);
      if (customersData.length > 0 && customerId === 0) setCustomerId(customersData[0].id);
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

  const getAvailableStock = (pId: number): number => {
    if (!pId) return 0;
    const stk = warehouseStock.find(s => s.product_id === pId);
    return stk ? stk.stock : 0;
  };

  const handleProductSelect = (index: number, pId: number) => {
    const prod = products.find(p => p.id === pId);
    const newItems = [...items];
    newItems[index].product_id = pId;
    if (prod) {
      newItems[index].unit_price = prod.sale_price;
      const available = getAvailableStock(pId);
      if (available <= 0) {
        setStockWarning(`⚠️ El producto "${prod.name}" no tiene existencias en este almacén (Stock: 0).`);
        newItems[index].quantity = 1;
      } else if (newItems[index].quantity > available) {
        newItems[index].quantity = available;
        setStockWarning(null);
      } else {
        setStockWarning(null);
      }
    }
    setItems(newItems);
  };

  const incrementQty = (index: number) => {
    const item = items[index];
    if (!item.product_id) {
      setStockWarning("Por favor selecciona primero un producto.");
      return;
    }
    const available = getAvailableStock(item.product_id);
    if (available <= 0) {
      setStockWarning("⚠️ ¡Ya no hay más producto en stock, está agotado! (0 unidades en este almacén).");
      setTimeout(() => setStockWarning(null), 4000);
      return;
    }
    if (item.quantity >= available) {
      setStockWarning(`⚠️ ¡Ya no hay más producto en stock, está agotado! Solo quedan ${available} unidades disponibles en almacén.`);
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
    const available = getAvailableStock(item.product_id);
    let finalVal = val;
    if (val > available) {
      setStockWarning(`⚠️ ¡Ya no hay más producto en stock, está agotado! Se ajustó a la cantidad máxima disponible (${available} unidades).`);
      setTimeout(() => setStockWarning(null), 4000);
      finalVal = Math.max(1, available);
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
      subtotal: round(subtotal),
      tax: round(tax),
      total: round(subtotal + tax)
    };
  };

  const round = (num: number) => Math.round(num * 100) / 100;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.product_id > 0);
    if (validItems.length === 0) {
      alert("Debes agregar al menos un producto a la venta.");
      return;
    }

    // Validar si algún producto no tiene stock
    if (status === 'FACTURADA' || status === 'PEDIDO') {
      for (const it of validItems) {
        const avail = getAvailableStock(it.product_id);
        if (it.quantity > avail) {
          const prod = products.find(p => p.id === it.product_id);
          alert(`¡Stock insuficiente para "${prod?.name}"! Disponible: ${avail}, Solicitado: ${it.quantity}.`);
          return;
        }
      }
    }

    try {
      const created = await api.createSale({
        customer_id: customerId,
        warehouse_id: warehouseId,
        status,
        notes,
        items: validItems
      });
      setIsCreateOpen(false);
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
      setNotes('');
      loadData();
      if (warehouseId) loadWarehouseStock(warehouseId);
      setPrintingSale(created);
    } catch (err: any) {
      alert(err.message || 'Error al emitir comprobante de venta');
    }
  };

  const handleCancelSale = async (id: number) => {
    if (confirm('¿Está seguro de anular esta venta? Se restituirá el stock y se ajustará el saldo del cliente.')) {
      try {
        await api.cancelSale(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Error al anular venta');
      }
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredSales.map(s => ({
      Comprobante: s.sale_number,
      Cliente: s.customer_name,
      Fecha: new Date(s.sale_date).toLocaleDateString(),
      Estado: s.status,
      CondicionPago: s.payment_status,
      Subtotal: s.subtotal,
      IGV_18: s.tax,
      Total: s.total
    }));
    exportToCSV(exportData, 'ventas_comprobantes');
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'TODAS' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Comercial & Ventas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Emisión de facturas electrónicas, cotizaciones y pedidos con validación de stock.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => {
              setStockWarning(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['TODAS', 'FACTURADA', 'COTIZACION', 'PEDIDO', 'ANULADA'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-4">N° Comprobante</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Almacén Despacho</th>
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
                  <td colSpan={8} className="p-8 text-center text-slate-400">Cargando operaciones comerciales...</td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No se encontraron ventas registradas.</td>
                </tr>
              ) : filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600 dark:text-sky-400">{sale.sale_number}</td>
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{sale.customer_name}</td>
                  <td className="p-4">{sale.warehouse_name}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      sale.status === 'FACTURADA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      sale.status === 'COTIZACION' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400' :
                      sale.status === 'PEDIDO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      sale.payment_status === 'PAGADO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {sale.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    S/. {Number(sale.total).toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        title="Ver Detalle"
                        className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPrintingSale(sale)}
                        title="Imprimir Factura / Ticket"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {sale.status !== 'ANULADA' && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          title="Anular Venta"
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

      {/* Modal Emitir Venta con soporte Múltiples Productos y Validación Estricta de Stock */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Emitir Comprobante de Venta"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          {/* Alerta de Stock Agotado */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cliente</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.document_number})</option>
                ))}
              </select>
              {(() => {
                const selCust = customers.find(c => c.id === customerId);
                return selCust ? (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 block">
                    Saldo CxC: S/. {Number(selCust.current_balance || 0).toFixed(2)}
                  </span>
                ) : null;
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Almacén Despacho</label>
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo Comprobante</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="FACTURADA">Factura / Boleta Electrónica</option>
                <option value="COTIZACION">Cotización Comercial</option>
                <option value="PEDIDO">Nota de Pedido</option>
              </select>
            </div>
          </div>

          {/* Tabla de Productos Múltiples */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ítems de la Venta ({items.length} {items.length === 1 ? 'producto' : 'productos'})
                </span>
                <p className="text-[11px] text-slate-400">Puedes despachar múltiples productos en el mismo comprobante.</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Otro Producto</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const available = getAvailableStock(item.product_id);
                const isOutOfStock = item.product_id > 0 && available <= 0;
                const isMax = item.product_id > 0 && item.quantity >= available;

                return (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center gap-3">
                    {/* Selector Producto */}
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Producto #{idx + 1}</label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => handleProductSelect(idx, Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value={0}>-- Seleccionar Producto del Catálogo --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} (S/. {p.sale_price})
                          </option>
                        ))}
                      </select>
                      {item.product_id > 0 && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <StockQuantityPill stock={available} unit="UND" />
                          <StockStatusBadge stock={available} size="sm" />
                          {isMax && !isOutOfStock && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              (Máximo disponible)
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
                          disabled={item.quantity <= 1 || isOutOfStock}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs disabled:opacity-40 cursor-pointer"
                          title="Restar 1 unidad"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={available}
                          disabled={isOutOfStock}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                          className="w-full text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => incrementQty(idx)}
                          disabled={isOutOfStock}
                          className={`px-3 py-2 font-bold text-xs cursor-pointer transition-colors ${
                            isMax || isOutOfStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                          title={isMax ? 'No hay más en stock' : 'Añadir 1 unidad'}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Precio Venta */}
                    <div className="w-full md:w-32">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Precio Unit.</label>
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

                    {/* Subtotal */}
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

            {/* Totales */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-100 dark:bg-slate-800/90 p-4 rounded-2xl gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Total de Ítems a Facturar: <b>{items.reduce((acc, i) => acc + (i.product_id > 0 ? i.quantity : 0), 0)} unidades</b>
              </span>
              <div className="flex items-center gap-6">
                <span className="text-slate-600 dark:text-slate-300">Subtotal: <b>S/. {totals.subtotal.toFixed(2)}</b></span>
                <span className="text-slate-600 dark:text-slate-300">IGV (18%): <b>S/. {totals.tax.toFixed(2)}</b></span>
                <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                  Total: S/. {totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas / Glosa</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Entrega inmediata en sede cliente"
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
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 cursor-pointer transition-all"
            >
              Emitir Comprobante
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalle */}
      {selectedSale && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSale(null)}
          title={`Detalle de Venta: ${selectedSale.sale_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <div>
                <span className="text-slate-400 block">Cliente:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{selectedSale.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fecha y Hora:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(selectedSale.sale_date).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Almacén Despacho:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSale.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Estado Operativo:</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">{selectedSale.status}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Ítems Facturados</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Precio Unit.</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedSale.details?.map((d: any, idx: number) => (
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
              <span>Subtotal: S/. {Number(selectedSale.subtotal).toFixed(2)}</span>
              <span>IGV (18%): S/. {Number(selectedSale.tax).toFixed(2)}</span>
              <span className="font-bold text-sm text-sky-600 dark:text-sky-400 font-mono">
                Total: S/. {Number(selectedSale.total).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Invoice Modal */}
      {printingSale && (
        <InvoicePrintModal
          sale={printingSale}
          onClose={() => setPrintingSale(null)}
        />
      )}
    </div>
  );
};
