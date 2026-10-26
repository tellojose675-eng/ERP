import React, { useEffect, useState } from 'react';
import { Boxes, Plus, ArrowLeftRight, Sliders, History, Search, Download, Filter, CheckCircle2, PlusCircle, Loader2, X } from 'lucide-react';
import { api } from '../../services/api';
import { Product, Warehouse, InventoryItem, InventoryMovement, Category } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';
import { StockStatusBadge, StockQuantityPill } from '../../components/StockStatusBadge';
import { formatPeruDateTime } from '../../utils/dateUtils';

export const InventoryModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'stock' | 'kardex' | 'operations'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [kardex, setKardex] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // New product form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number>(1);
  const [newUnit, setNewUnit] = useState('UND');
  const [newCost, setNewCost] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [newMinStock, setNewMinStock] = useState(5);

  // Operation forms
  const [adjProductId, setAdjProductId] = useState<number>(1);
  const [adjWarehouseId, setAdjWarehouseId] = useState<number>(1);
  const [adjType, setAdjType] = useState<string>('ENTRADA');
  const [adjQuantity, setAdjQuantity] = useState<number>(10);
  const [adjNotes, setAdjNotes] = useState<string>('');

  const [transProductId, setTransProductId] = useState<number>(1);
  const [fromWhId, setFromWhId] = useState<number>(1);
  const [toWhId, setToWhId] = useState<number>(2);
  const [transQty, setTransQty] = useState<number>(5);

  // Quick stock modal
  const [quickProduct, setQuickProduct] = useState<{ id: number; name: string; code: string } | null>(null);
  const [quickQty, setQuickQty] = useState<number>(10);
  const [quickWhId, setQuickWhId] = useState<number>(0);
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prods, whs, cats, stk, krdx] = await Promise.all([
        api.getProducts(),
        api.getWarehouses(),
        api.getCategories(),
        api.getStock(),
        api.getKardex()
      ]);
      setProducts(prods);
      setWarehouses(whs);
      setCategories(cats);
      setStockItems(stk);
      setKardex(krdx);
      if (prods.length > 0) {
        setAdjProductId(prods[0].id);
        setTransProductId(prods[0].id);
      }
      if (cats.length > 0) setNewCategoryId(cats[0].id);
      if (whs.length > 0) setQuickWhId(whs[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const handleDataChanged = () => {
      loadAll();
    };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        code: newCode,
        name: newName,
        category_id: newCategoryId,
        unit: newUnit,
        purchase_price: newCost,
        sale_price: newPrice,
        min_stock: newMinStock
      });
      setIsProductModalOpen(false);
      setNewCode('');
      setNewName('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error al registrar producto');
    }
  };

  const handleQuickStock = async () => {
    if (!quickProduct || quickQty <= 0 || !quickWhId) return;
    setQuickLoading(true);
    try {
      await api.adjustStock({
        product_id: quickProduct.id,
        warehouse_id: quickWhId,
        movement_type: 'ENTRADA',
        quantity: quickQty,
        notes: quickNotes || `Ingreso rápido — ${quickProduct.name}`,
      });
      setQuickSuccess(true);
      setTimeout(() => {
        setQuickProduct(null);
        setQuickSuccess(false);
        setQuickQty(10);
        setQuickNotes('');
        loadAll();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Error al ajustar stock');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adjustStock({
        product_id: adjProductId,
        warehouse_id: adjWarehouseId,
        movement_type: adjType,
        quantity: adjQuantity,
        notes: adjNotes
      });
      alert('Ajuste aplicado exitosamente');
      setAdjNotes('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error en ajuste');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.transferStock({
        product_id: transProductId,
        from_warehouse_id: fromWhId,
        to_warehouse_id: toWhId,
        quantity: transQty
      });
      alert('Transferencia completada');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error en transferencia');
    }
  };

  const handleExportCSV = () => {
    if (activeSubTab === 'products') {
      const exportData = filteredProducts.map(p => ({
        SKU: p.code,
        Producto: p.name,
        Categoria: p.category?.name || 'General',
        Unidad: p.unit,
        Costo: p.purchase_price,
        PrecioVenta: p.sale_price,
        StockMinimo: p.min_stock,
        StockGlobal: p.total_stock || 0
      }));
      exportToCSV(exportData, 'catalogo_productos');
    } else if (activeSubTab === 'stock') {
      const exportData = stockItems.map(s => ({
        Almacen: s.warehouse_name,
        Codigo: s.product_code,
        Producto: s.product_name,
        StockFisico: s.stock,
        Reservado: s.reserved_stock,
        Disponible: s.stock - s.reserved_stock
      }));
      exportToCSV(exportData, 'stock_por_almacen');
    } else if (activeSubTab === 'kardex') {
      const exportData = kardex.map(k => ({
        Fecha: formatPeruDateTime(k.created_at),
        Producto: k.product_name,
        Almacen: k.warehouse_name,
        TipoMovimiento: k.movement_type,
        Cantidad: k.quantity,
        StockPrevio: k.previous_stock,
        NuevoStock: k.new_stock,
        Motivo: k.notes || '-'
      }));
      exportToCSV(exportData, 'kardex_permanente');
    } else {
      // Subtab operations (Ajustes y Transferencias)
      const exportData = products.map(p => ({
        SKU: p.code,
        Producto: p.name,
        Unidad: p.unit,
        StockGlobal: p.total_stock || 0,
        CostoUnitario: p.purchase_price,
        ValorizadoTotal: ((p.total_stock || 0) * p.purchase_price).toFixed(2)
      }));
      exportToCSV(exportData, 'resumen_inventario_operaciones');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventario & Kardex Permanente</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Control de catálogo ({products.length} productos), multi-almacén y asientos de Kardex.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'products' ? 'border-sky-600 text-sky-600 dark:text-sky-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Catálogo de Productos ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stock')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'stock' ? 'border-sky-600 text-sky-600 dark:text-sky-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Stock por Almacén</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kardex')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'kardex' ? 'border-sky-600 text-sky-600 dark:text-sky-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Kardex Permanente</span>
        </button>

        <button
          onClick={() => setActiveSubTab('operations')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'operations' ? 'border-sky-600 text-sky-600 dark:text-sky-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Ajustes & Transferencias</span>
        </button>
      </div>

      {/* Subtab 1: Products */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por SKU o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Categoría:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">SKU / Código</th>
                    <th className="py-3.5 px-4">Nombre del Producto</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4 text-center">Unidad</th>
                    <th className="py-3.5 px-4 text-right">Costo (S/.)</th>
                    <th className="py-3.5 px-4 text-right">Precio Venta (S/.)</th>
                    <th className="py-3.5 px-4 text-center">Stock Mín.</th>
                    <th className="py-3.5 px-4 text-center">Stock Global</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => {
                    const isLow = (p.total_stock || 0) <= p.min_stock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">{p.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{p.unit}</td>
                        <td className="py-3 px-4 text-right font-mono">S/. {p.purchase_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sky-700 dark:text-sky-400">S/. {p.sale_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">{p.min_stock}</td>
                        <td className="py-3 px-4 text-center">
                          <StockQuantityPill stock={p.total_stock || 0} unit={p.unit} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StockStatusBadge stock={p.total_stock || 0} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setQuickProduct({ id: p.id, name: p.name, code: p.code });
                              setQuickQty(10);
                              setQuickNotes('');
                              setQuickSuccess(false);
                              if (warehouses.length > 0) setQuickWhId(warehouses[0].id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Ingresar stock rápido"
                          >
                            <PlusCircle className="w-3 h-3" />
                            Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Stock por Almacén */}
      {activeSubTab === 'stock' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Almacén</th>
                <th className="py-3.5 px-4">Código Producto</th>
                <th className="py-3.5 px-4">Descripción</th>
                <th className="py-3.5 px-4 text-right">Existencia Actual</th>
                <th className="py-3.5 px-4 text-right">Stock Reservado</th>
                <th className="py-3.5 px-4 text-right">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.warehouse_name}</td>
                  <td className="py-3 px-4 font-mono font-medium">{item.product_code}</td>
                  <td className="py-3 px-4">{item.product_name}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{item.stock}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">{item.reserved_stock}</td>
                  <td className="py-3 px-4 text-right">
                    <StockQuantityPill stock={item.stock - item.reserved_stock} unit="" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: Kardex */}
      {activeSubTab === 'kardex' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha / Hora</th>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Almacén</th>
                <th className="py-3.5 px-4">Tipo Movimiento</th>
                <th className="py-3.5 px-4 text-right">Stock Previo</th>
                <th className="py-3.5 px-4 text-right">Cantidad</th>
                <th className="py-3.5 px-4 text-right">Nuevo Stock</th>
                <th className="py-3.5 px-4">Motivo / Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {kardex.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{formatPeruDateTime(k.created_at)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{k.product_name}</td>
                  <td className="py-3 px-4">{k.warehouse_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      k.movement_type === 'ENTRADA' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                      k.movement_type === 'SALIDA' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                      'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {k.movement_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{k.previous_stock}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {k.movement_type === 'ENTRADA' ? `+${k.quantity}` : `-${k.quantity}`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{k.new_stock}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{k.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 4: Ajustes y Transferencias */}
      {activeSubTab === 'operations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ajuste Manual */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Ajuste de Stock en Almacén</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ingresos extraordinarios, mermas o regularizaciones contables.</p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Producto</label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Almacén</label>
                <select
                  value={adjWarehouseId}
                  onChange={(e) => setAdjWarehouseId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo Ajuste</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="SALIDA">Salida (-)</option>
                    <option value="AJUSTE">Fijar Stock Exacto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Justificación</label>
                <input
                  type="text"
                  placeholder="ej: Regularización por conteo físico"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Aplicar Asiento a Kardex
              </button>
            </form>
          </div>

          {/* Transferencia */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Transferencia entre Almacenes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Movimiento físico o lógico de mercancías con doble asiento en Kardex.</p>

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Producto</label>
                <select
                  value={transProductId}
                  onChange={(e) => setTransProductId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Almacén Origen</label>
                  <select
                    value={fromWhId}
                    onChange={(e) => setFromWhId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Almacén Destino</label>
                  <select
                    value={toWhId}
                    onChange={(e) => setToWhId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad a Transferir</label>
                <input
                  type="number"
                  min="1"
                  value={transQty}
                  onChange={(e) => setTransQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors"
              >
                Ejecutar Transferencia Transaccional
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Crear Nuevo Producto en Catálogo"
      >
        <form onSubmit={handleCreateProduct} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Código SKU</label>
              <input
                type="text"
                required
                placeholder="ej: PROD-SRV-01"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Comercial</label>
            <input
              type="text"
              required
              placeholder="ej: Servidor Blade Dual Intel Xeon"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unidad Medida</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Costo Compra (S/.)</label>
              <input
                type="number"
                step="0.01"
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio Venta (S/.)</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Umbral Stock Mínimo</label>
            <input
              type="number"
              value={newMinStock}
              onChange={(e) => setNewMinStock(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20"
            >
              Guardar en Catálogo
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Quick Stock Modal ── */}
      {quickProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Ingresar Stock</h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 font-mono">{quickProduct.code}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{quickProduct.name}</p>
              </div>
              <button
                onClick={() => setQuickProduct(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {quickSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">¡Stock ingresado!</p>
                <p className="text-xs text-slate-400">+{quickQty} unidades registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Almacén destino</label>
                  <select
                    value={quickWhId}
                    onChange={e => setQuickWhId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad a ingresar</label>
                  <input
                    type="number"
                    min="1"
                    value={quickQty}
                    onChange={e => setQuickQty(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo (opcional)</label>
                  <input
                    type="text"
                    placeholder="ej: Reposición de stock"
                    value={quickNotes}
                    onChange={e => setQuickNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setQuickProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleQuickStock}
                    disabled={quickLoading || quickQty <= 0}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                  >
                    {quickLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
                      : <><PlusCircle className="w-4 h-4" />Ingresar {quickQty} UND</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
