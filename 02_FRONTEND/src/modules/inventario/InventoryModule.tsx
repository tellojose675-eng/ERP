import React, { useEffect, useState, useRef } from 'react';
import { Boxes, Plus, ArrowLeftRight, Sliders, History, Search, Download, Filter, CheckCircle2, PlusCircle, Loader2, X, Upload, Zap, Copy, Sparkles, TrendingUp, RefreshCw, Building2, Package, AlertTriangle, DollarSign, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Product, Warehouse, InventoryItem, InventoryMovement, Category } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';
import { importCSVFlow } from '../../utils/importFromCSV';
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
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Warehouse separation states
  const [selectedStockWhId, setSelectedStockWhId] = useState<number | 'ALL'>('ALL');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW' | 'OUT'>('ALL');

  // New warehouse modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [newWhCode, setNewWhCode] = useState('');
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');
  const [isSavingWh, setIsSavingWh] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSuccessToast, setProductSuccessToast] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // New product form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number>(1);
  const [newUnit, setNewUnit] = useState('UND');
  const [newCost, setNewCost] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [newMinStock, setNewMinStock] = useState(5);
  // Initial stock in modal
  const [withInitialStock, setWithInitialStock] = useState(false);
  const [initialStockQty, setInitialStockQty] = useState<number | ''>(10);
  const [initialStockWhId, setInitialStockWhId] = useState<number>(1);


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
  const [quickQty, setQuickQty] = useState<number | ''>(10);
  const [quickWhId, setQuickWhId] = useState<number>(0);
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  // Auto-SKU generator helper
  const generateSKU = (catId?: number, currentProducts: Product[] = products): string => {
    const targetCatId = catId || newCategoryId;
    const cat = categories.find(c => c.id === targetCatId);
    let prefix = 'PRD';
    if (cat && cat.name) {
      const cleanName = cat.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const words = cleanName.split(/[\s-]+/).filter(Boolean);
      if (words.length >= 2) {
        prefix = (words[0].substring(0, 2) + words[1].substring(0, 2)).substring(0, 4);
      } else if (cleanName.length >= 3) {
        prefix = cleanName.substring(0, 3);
      }
    }

    let maxNum = 0;
    const prefixRegex = new RegExp(`^${prefix}-(\\d+)`, 'i');
    currentProducts.forEach(p => {
      const m = p.code.match(prefixRegex);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    let nextNum = maxNum + 1;
    let candidate = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    while (currentProducts.some(p => p.code.toUpperCase() === candidate.toUpperCase())) {
      nextNum++;
      candidate = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  };

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
      if (cats.length > 0) {
        setNewCategoryId(cats[0].id);
      }
      if (whs.length > 0) {
        setQuickWhId(whs[0].id);
        setInitialStockWhId(whs[0].id);
      }
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

  const handleOpenNewProductModal = () => {
    const targetCatId = categories[0]?.id || 1;
    setNewCategoryId(targetCatId);
    setNewCode(generateSKU(targetCatId));
    setNewName('');
    setNewUnit('UND');
    setNewCost(0);
    setNewPrice(0);
    setNewMinStock(5);
    setWithInitialStock(false);
    setInitialStockQty(10);
    if (warehouses.length > 0) setInitialStockWhId(warehouses[0].id);
    setProductSuccessToast(null);
    setIsProductModalOpen(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const handleCloneProduct = (p: Product) => {
    const catId = p.category_id || categories[0]?.id || 1;
    setNewCategoryId(catId);
    setNewUnit(p.unit);
    setNewCost(p.purchase_price);
    setNewPrice(p.sale_price);
    setNewMinStock(p.min_stock);
    setNewName(`${p.name} (Copia)`);
    setNewCode(generateSKU(catId));
    setWithInitialStock(false);
    setInitialStockQty(10);
    if (warehouses.length > 0) setInitialStockWhId(warehouses[0].id);
    setProductSuccessToast(null);
    setIsProductModalOpen(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 100);
  };

  const handleCreateProduct = async (e?: React.FormEvent, keepOpen = false) => {
    if (e) e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor ingresa el nombre comercial del producto');
      return;
    }
    const codeToSave = newCode.trim() || generateSKU(newCategoryId);
    try {
      setIsSavingProduct(true);
      const newProd = await api.createProduct({
        code: codeToSave.toUpperCase(),
        name: newName.trim(),
        category_id: newCategoryId,
        unit: newUnit || 'UND',
        purchase_price: Number(newCost) || 0,
        sale_price: Number(newPrice) || 0,
        min_stock: Number(newMinStock) || 5
      });

      const initQty = Number(initialStockQty);
      if (withInitialStock && initQty > 0 && initialStockWhId) {
        await api.adjustStock({
          product_id: newProd.id,
          warehouse_id: initialStockWhId,
          movement_type: 'ENTRADA',
          quantity: initQty,
          notes: `Stock Inicial de apertura — ${newProd.name}`
        });
      }

      await loadAll();

      if (keepOpen) {
        setProductSuccessToast(`¡"${newName}" registrado con éxito! Formulario listo para el siguiente.`);
        setTimeout(() => setProductSuccessToast(null), 3500);
        setNewName('');
        setNewCode(generateSKU(newCategoryId));
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      } else {
        setIsProductModalOpen(false);
        setNewCode('');
        setNewName('');
        setWithInitialStock(false);
        setProductSuccessToast(null);
      }
    } catch (err: any) {
      alert(err.message || 'Error al registrar producto');
    } finally {
      setIsSavingProduct(false);
    }
  };



  const handleDeleteProduct = async (p: Product) => {
    const stockTotal = p.total_stock || 0;
    if (stockTotal > 0) {
      alert(`No se puede eliminar "${p.name}": tiene ${stockTotal} unidades en stock activo.\nPrimero realiza una salida o transferencia de ese inventario.`);
      return;
    }
    if (!confirm(`¿Eliminar definitivamente "${p.name}" (${p.code}) del catálogo?\nEsta acción no se puede deshacer.`)) return;
    try {
      await api.deleteProduct(p.id);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    }
  };

  const handleQuickStock = async () => {
    const qty = Number(quickQty);
    if (!quickProduct || qty <= 0 || !quickWhId) return;
    setQuickLoading(true);
    try {
      await api.adjustStock({
        product_id: quickProduct.id,
        warehouse_id: quickWhId,
        movement_type: 'ENTRADA',
        quantity: qty,
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
      const exportData = filteredStockItems.map(s => ({
        Almacen: s.warehouse_name,
        Codigo: s.product_code,
        Producto: s.product_name,
        StockFisico: s.stock,
        Reservado: s.reserved_stock,
        Disponible: s.stock - s.reserved_stock
      }));
      exportToCSV(exportData, selectedStockWhId === 'ALL' ? 'stock_todos_almacenes' : `stock_${activeWarehouseObj?.name || 'almacen'}`);
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
      let created = 0, errors = 0;
      for (const row of result.data) {
        try {
          const code = row['SKU'] || row['codigo'] || row['code'] || row['Código'] || '';
          const name = row['Producto'] || row['nombre'] || row['name'] || row['Descripcion'] || '';
          if (!code || !name) { errors++; continue; }
          // Buscar categoría por nombre
          const catName = row['Categoria'] || row['categoria'] || row['category'] || '';
          const cat = categories.find(c => c.name.toLowerCase().includes(catName.toLowerCase()));
          await api.createProduct({
            code,
            name,
            category_id: cat?.id || (categories[0]?.id ?? 1),
            unit: row['Unidad'] || row['unidad'] || row['unit'] || 'UND',
            purchase_price: parseFloat(row['CostoUnitario'] || row['costo'] || row['purchase_price'] || '0') || 0,
            sale_price: parseFloat(row['PrecioVenta'] || row['precio'] || row['sale_price'] || '0') || 0,
            min_stock: parseFloat(row['StockMinimo'] || row['min_stock'] || '5') || 5
          });
          created++;
        } catch { errors++; }
      }
      setImportResult(`✅ ${created} productos importados${errors > 0 ? ` | ⚠️ ${errors} filas con error` : ''}`);
      loadAll();
    } catch (err: any) {
      setImportResult(`❌ Error: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhCode.trim() || !newWhName.trim()) {
      alert('Código y nombre de almacén son obligatorios');
      return;
    }
    try {
      setIsSavingWh(true);
      const created = await api.createWarehouse({
        code: newWhCode.trim().toUpperCase(),
        name: newWhName.trim(),
        location: newWhLocation.trim() || undefined
      });
      setIsWarehouseModalOpen(false);
      setNewWhCode('');
      setNewWhName('');
      setNewWhLocation('');
      await loadAll();
      if (created?.id) {
        setSelectedStockWhId(created.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error al registrar almacén');
    } finally {
      setIsSavingWh(false);
    }
  };

  // Cálculos dinámicos por almacén seleccionado
  const currentWhStock = stockItems.filter(item => selectedStockWhId === 'ALL' || item.warehouse_id === selectedStockWhId);
  const totalPhysicalStock = currentWhStock.reduce((acc, it) => acc + (it.stock || 0), 0);
  const totalReservedStock = currentWhStock.reduce((acc, it) => acc + (it.reserved_stock || 0), 0);
  const totalAvailableStock = totalPhysicalStock - totalReservedStock;
  const totalValuation = currentWhStock.reduce((acc, it) => {
    const p = products.find(prod => prod.id === it.product_id);
    return acc + (it.stock || 0) * (p?.purchase_price || 0);
  }, 0);
  const activeWarehouseObj = selectedStockWhId === 'ALL' ? null : warehouses.find(w => w.id === selectedStockWhId);

  const filteredStockItems = currentWhStock.filter(item => {
    const matchesSearch = !stockSearchTerm.trim() || 
      (item.product_name?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
       item.product_code?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
       item.warehouse_name?.toLowerCase().includes(stockSearchTerm.toLowerCase()));
    
    const product = products.find(p => p.id === item.product_id);
    const minStock = product?.min_stock || 5;
    const isOut = item.stock <= 0;
    const isLow = item.stock > 0 && item.stock <= minStock;
    
    if (stockStatusFilter === 'OUT') return matchesSearch && isOut;
    if (stockStatusFilter === 'LOW') return matchesSearch && isLow;
    if (stockStatusFilter === 'IN_STOCK') return matchesSearch && !isOut && !isLow;
    return matchesSearch;
  });

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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleImportCSV}
            disabled={importLoading}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-60"
          >
            <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>{importLoading ? 'Importando...' : 'Importar CSV'}</span>
          </button>
          <button
            onClick={handleOpenNewProductModal}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
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

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap pb-1">
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
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => {
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCloneProduct(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="Duplicar producto (pre-rellena datos con nuevo SKU sugerido)"
                            >
                              <Copy className="w-3 h-3" />
                              Duplicar
                            </button>
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
                              + Stock
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title={p.total_stock && p.total_stock > 0 ? `No eliminable: tiene ${p.total_stock} uds en stock` : 'Eliminar producto del catálogo'}
                            >
                              <Trash2 className="w-3 h-3" />
                              Borrar
                            </button>
                          </div>
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

      {/* Subtab 2: Stock por Almacén con Pestañas y Métricas */}
      {activeSubTab === 'stock' && (
        <div className="space-y-4">
          {/* Barra de Pestañas por Almacén */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {/* Pestaña: Todos */}
              <button
                onClick={() => setSelectedStockWhId('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  selectedStockWhId === 'ALL'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Vista Consolidada (Todos)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedStockWhId === 'ALL' ? 'bg-sky-700 text-sky-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {stockItems.length}
                </span>
              </button>

              {/* Pestaña por cada Almacén individual */}
              {warehouses.map(wh => {
                const whItemCount = stockItems.filter(s => s.warehouse_id === wh.id).length;
                const isSelected = selectedStockWhId === wh.id;
                return (
                  <button
                    key={wh.id}
                    onClick={() => setSelectedStockWhId(wh.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{wh.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isSelected ? 'bg-sky-700 text-sky-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {whItemCount}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsWarehouseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              title="Registrar una nueva sede o almacén"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Almacén</span>
            </button>
          </div>

          {/* KPI Cards del Almacén Seleccionado */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {selectedStockWhId === 'ALL' ? 'Total Variedad Global' : `Productos en ${activeWarehouseObj?.name}`}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{currentWhStock.length} ítems</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Existencia Física</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalPhysicalStock.toLocaleString()} UND</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Disponible vs Reservado</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate">
                  <span className="text-sky-600 dark:text-sky-400">{totalAvailableStock.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-normal"> / {totalReservedStock} res.</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">Valorización a Costo</p>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono truncate">
                  S/. {totalValuation.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Filtros y Buscador dentro del Almacén */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={selectedStockWhId === 'ALL' ? "Buscar producto en todos los almacenes..." : `Buscar producto en ${activeWarehouseObj?.name}...`}
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">Estado:</span>
              <button
                onClick={() => setStockStatusFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos ({currentWhStock.length})
              </button>
              <button
                onClick={() => setStockStatusFilter('IN_STOCK')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'IN_STOCK'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Disponibles
              </button>
              <button
                onClick={() => setStockStatusFilter('LOW')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'LOW'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                Stock Bajo
              </button>
              <button
                onClick={() => setStockStatusFilter('OUT')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'OUT'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                Agotados
              </button>
            </div>
          </div>

          {/* Tabla de Stock Exclusiva del Almacén */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {selectedStockWhId === 'ALL' && <th className="py-3.5 px-4 whitespace-nowrap">Almacén</th>}
                    <th className="py-3.5 px-4 whitespace-nowrap">Código SKU</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Producto</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Unidad</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Costo Unit.</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Existencia Física</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Reservado</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Disponible</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Valorizado S/.</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={selectedStockWhId === 'ALL' ? 11 : 10} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron existencias en este almacén con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredStockItems.map((item) => {
                      const prod = products.find(p => p.id === item.product_id);
                      const unit = prod?.unit || 'UND';
                      const cost = prod?.purchase_price || 0;
                      const valTotal = (item.stock || 0) * cost;
                      const available = item.stock - item.reserved_stock;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          {selectedStockWhId === 'ALL' && (
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {item.warehouse_name}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.product_code}</td>
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{item.product_name}</td>
                          <td className="py-3 px-4 text-center">{unit}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">S/. {cost.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{item.stock}</td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">{item.reserved_stock}</td>
                          <td className="py-3 px-4 text-right">
                            <StockQuantityPill stock={available} unit={unit} />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            S/. {valTotal.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StockStatusBadge stock={available} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setQuickProduct({
                                  id: item.product_id,
                                  name: item.product_name || '',
                                  code: item.product_code || ''
                                });
                                setQuickWhId(item.warehouse_id);
                                setQuickQty(10);
                                setQuickNotes('');
                                setQuickSuccess(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                              title="Ingresar stock directamente a este almacén"
                            >
                              <PlusCircle className="w-3 h-3" />
                              + Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Kardex */}
      {activeSubTab === 'kardex' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Fecha / Hora</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Producto</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Almacén</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tipo Movimiento</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Stock Previo</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Cantidad</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Nuevo Stock</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Motivo / Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {kardex.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">{formatPeruDateTime(k.created_at)}</td>
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
        title="Registrar Producto en Catálogo"
        maxWidth="max-w-xl"
      >
        <form onSubmit={(e) => handleCreateProduct(e, false)} className="space-y-3.5">
          {/* Toast de éxito para carga continua */}
          {productSuccessToast && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{productSuccessToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Código SKU *</label>
                <button
                  type="button"
                  onClick={() => setNewCode(generateSKU(newCategoryId))}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 hover:underline cursor-pointer"
                  title="Generar código correlativo único para esta categoría"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Auto-generar SKU
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="ej: LAP-001"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold uppercase tracking-wider"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <select
                value={newCategoryId}
                onChange={(e) => {
                  const catId = Number(e.target.value);
                  setNewCategoryId(catId);
                  // Si el SKU está vacío o parecía autogenerado, actualizarlo
                  if (!newCode || newCode.includes('-')) {
                    setNewCode(generateSKU(catId));
                  }
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Comercial del Producto *</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="ej: Monitor LG UltraWide 29 Pulgadas IPS FHD"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unidad Medida</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="UND, KG, MT"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Costo Compra S/.</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newCost || ''}
                onChange={(e) => setNewCost(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio Venta S/.</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold text-sky-700 dark:text-sky-400"
              />
            </div>
          </div>

          {/* Margen proyectado en tiempo real */}
          {newPrice > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Margen comercial proyectado:</span>
              <span className={`font-mono font-bold flex items-center gap-1.5 ${
                newPrice >= newCost ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                Ganancia: S/. {(newPrice - newCost).toFixed(2)} ({newCost > 0 ? (((newPrice - newCost) / newCost) * 100).toFixed(1) : '100'}%)
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alerta de Stock Mínimo</label>
            <input
              type="number"
              min="0"
              value={newMinStock}
              onChange={(e) => setNewMinStock(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Stock Inicial Opcional (2 en 1) */}
          <div className="p-3.5 rounded-xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={withInitialStock}
                onChange={(e) => setWithInitialStock(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                📦 Asignar Stock Inicial de apertura ahora (Ahorra un paso)
              </span>
            </label>
            {withInitialStock && (
              <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Almacén Destino</label>
                  <select
                    value={initialStockWhId}
                    onChange={(e) => setInitialStockWhId(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Cantidad Inicial ({newUnit})</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={initialStockQty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInitialStockQty(val === '' ? '' : Math.max(0, Number(val)));
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={(e) => handleCreateProduct(e, true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title="Guarda este producto y mantiene el formulario listo para el siguiente inmediatamente"
              >
                {isSavingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Guardar y Crear Siguiente</span>
              </button>
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={(e) => handleCreateProduct(e, false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              >
                {isSavingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Guardar y Cerrar</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Almacén */}
      <Modal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title="Crear Nueva Sede o Almacén"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Código del Almacén *</label>
            <input
              type="text"
              required
              placeholder="ej: ALM-SUR-01"
              value={newWhCode}
              onChange={(e) => setNewWhCode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Sede / Almacén *</label>
            <input
              type="text"
              required
              placeholder="ej: Almacén Secundario Arequipa"
              value={newWhName}
              onChange={(e) => setNewWhName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dirección / Ubicación Física (Opcional)</label>
            <input
              type="text"
              placeholder="ej: Av. Ejército 405, Cayma, Arequipa"
              value={newWhLocation}
              onChange={(e) => setNewWhLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsWarehouseModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingWh}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
            >
              {isSavingWh ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Guardar Almacén</span>
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
                    placeholder="0"
                    value={quickQty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickQty(val === '' ? '' : Math.max(0, Number(val)));
                    }}
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
                    disabled={quickLoading || !quickQty || Number(quickQty) <= 0}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                  >
                    {quickLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
                      : <><PlusCircle className="w-4 h-4" />Ingresar {quickQty || 0} UND</>}
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
