import React, { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingCart, Receipt, AlertTriangle, Boxes,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Trash2, AlertOctagon,
  X, Loader2, Sparkles, Tag, Users, Factory, Warehouse, Package,
  ClipboardList, BadgeDollarSign, BarChart3, CircleDot,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { StockStatusBadge, StockQuantityPill } from '../components/StockStatusBadge';

// ────────────────────────────────────────────────────────────────────────────────
// Simulation data
// ────────────────────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface SimStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: StepStatus;
}

const SIM_CATEGORIES = [
  { name: 'Laptops & Computadoras',   description: 'Equipos portátiles y workstations' },
  { name: 'Smartphones & Celulares',  description: 'Teléfonos inteligentes de alta gama' },
  { name: 'Tablets & iPads',          description: 'Dispositivos tableta multifuncionales' },
  { name: 'Monitores & Pantallas',    description: 'Pantallas profesionales y gaming' },
  { name: 'Componentes & CPUs',       description: 'Procesadores y piezas de ensamblaje' },
];

const SIM_CUSTOMERS = [
  { document_type: 'RUC', document_number: '20512345671', name: 'Tech Solutions SAC',   email: 'compras@techsolutions.pe', phone: '01-4123456', address: 'Av. Javier Prado Este 1234, San Isidro', credit_limit: 50000 },
  { document_type: 'RUC', document_number: '20601234562', name: 'Digital Corp SRL',      email: 'contacto@digitalcorp.pe',  phone: '01-5678901', address: 'Jr. de la Unión 456, Lima',            credit_limit: 30000 },
  { document_type: 'RUC', document_number: '20702345673', name: 'InnoTech EIRL',         email: 'gerencia@innotech.pe',     phone: '999-111-222',address: 'Av. Arequipa 789, Miraflores',         credit_limit: 20000 },
  { document_type: 'DNI', document_number: '45678912',    name: 'Carlos Mendoza Quispe', email: 'carlos.mendoza@gmail.com', phone: '987-654-321', address: 'Jr. Huallaga 100, Lima',               credit_limit: 10000 },
];

const SIM_SUPPLIERS = [
  { document_type: 'RUC', document_number: '20100123451', name: 'Apple Distribuidora Perú SAC', contact_name: 'María García',  email: 'ventas@appledist.pe', phone: '01-2001234', address: 'Av. La Marina 2000, San Miguel',             credit_limit: 200000 },
  { document_type: 'RUC', document_number: '20200234562', name: 'HP Mayoristas Perú SRL',       contact_name: 'Roberto Silva', email: 'pedidos@hpmay.pe',    phone: '01-3002345', address: 'Av. Venezuela 3600, Breña',                  credit_limit: 150000 },
  { document_type: 'RUC', document_number: '20300345673', name: 'Samsung Electronics Perú',    contact_name: 'Ana Torres',    email: 'b2b@samsung.pe',      phone: '01-4003456', address: 'Av. República de Panamá 3030, San Isidro', credit_limit: 180000 },
];

const SIM_WAREHOUSE = { code: 'ALM-001', name: 'Almacén Principal Lima', location: 'Av. Venezuela 3600, Breña, Lima' };

function buildProducts(catIds: number[]) {
  return [
    { code: 'LAP-HP-001', name: 'Laptop HP Pavilion 15 Core i5',  description: 'Intel Core i5-12450H, 8GB RAM, 512GB SSD', category_id: catIds[0], unit: 'UND', purchase_price: 1800, sale_price: 2499, min_stock: 3 },
    { code: 'IPH-15-001', name: 'iPhone 15 Pro 256GB Natural',     description: 'Chip A17 Pro, Titanio Natural, Triple cámara', category_id: catIds[1], unit: 'UND', purchase_price: 3200, sale_price: 4299, min_stock: 5 },
    { code: 'TAB-IP-001', name: 'iPad Air M2 11" WiFi 256GB',      description: 'Chip Apple M2, Pantalla Liquid Retina 11"',   category_id: catIds[2], unit: 'UND', purchase_price: 1600, sale_price: 2199, min_stock: 3 },
    { code: 'MON-LG-001', name: 'Monitor LG 27UK850 27" 4K UHD',  description: '4K IPS, USB-C 60W, HDR10, 99% sRGB',         category_id: catIds[3], unit: 'UND', purchase_price:  900, sale_price: 1299, min_stock: 2 },
    { code: 'CPU-IN-001', name: 'Procesador Intel Core i7-13700K', description: '16 núcleos, 5.4 GHz Max Turbo, LGA1700',     category_id: catIds[4], unit: 'UND', purchase_price:  750, sale_price:  999, min_stock: 5 },
  ];
}

function buildPurchases(supplierIds: number[], whId: number, prodIds: number[]) {
  return [
    { supplier_id: supplierIds[1], warehouse_id: whId, status: 'RECIBIDA', notes: 'OC-001 · Laptops HP y CPUs Intel',
      items: [{ product_id: prodIds[0], quantity: 10, unit_price: 1800 }, { product_id: prodIds[4], quantity: 20, unit_price: 750 }] },
    { supplier_id: supplierIds[0], warehouse_id: whId, status: 'RECIBIDA', notes: 'OC-002 · iPhones e iPads Apple',
      items: [{ product_id: prodIds[1], quantity: 15, unit_price: 3200 }, { product_id: prodIds[2], quantity: 10, unit_price: 1600 }] },
    { supplier_id: supplierIds[2], warehouse_id: whId, status: 'RECIBIDA', notes: 'OC-003 · Monitores Samsung 4K',
      items: [{ product_id: prodIds[3], quantity: 12, unit_price: 900 }] },
  ];
}

function buildSales(customerIds: number[], whId: number, prodIds: number[]) {
  return [
    { customer_id: customerIds[0], warehouse_id: whId, status: 'FACTURADA', notes: 'VTA-001 · Equipamiento corporativo',
      items: [{ product_id: prodIds[0], quantity: 3, unit_price: 2499 }, { product_id: prodIds[3], quantity: 4, unit_price: 1299 }] },
    { customer_id: customerIds[1], warehouse_id: whId, status: 'FACTURADA', notes: 'VTA-002 · Smartphones ejecutivos',
      items: [{ product_id: prodIds[1], quantity: 5, unit_price: 4299 }, { product_id: prodIds[2], quantity: 2, unit_price: 2199 }] },
    { customer_id: customerIds[2], warehouse_id: whId, status: 'FACTURADA', notes: 'VTA-003 · Ensamblaje PCs gamer',
      items: [{ product_id: prodIds[4], quantity: 8, unit_price: 999 }, { product_id: prodIds[0], quantity: 2, unit_price: 2499 }] },
    { customer_id: customerIds[3], warehouse_id: whId, status: 'FACTURADA', notes: 'VTA-004 · Compra personal premium',
      items: [{ product_id: prodIds[1], quantity: 1, unit_price: 4299 }, { product_id: prodIds[2], quantity: 1, unit_price: 2199 }, { product_id: prodIds[4], quantity: 3, unit_price: 999 }] },
  ];
}

function buildPayments(customerIds: number[], supplierIds: number[]) {
  return [
    { payment_type: 'COBRO_CLIENTE',  reference_type: 'DIRECTO', entity_id: customerIds[0], amount: 12000, payment_method: 'TRANSFERENCIA', bank_account: 'BCP 191-23849180-12',      transaction_ref: 'OP-TC-001', notes: 'Abono Tech Solutions' },
    { payment_type: 'COBRO_CLIENTE',  reference_type: 'DIRECTO', entity_id: customerIds[1], amount: 18000, payment_method: 'DEPOSITO',      bank_account: 'BBVA 0011-0175-01-234567', transaction_ref: 'OP-TC-002', notes: 'Cobro Digital Corp' },
    { payment_type: 'COBRO_CLIENTE',  reference_type: 'DIRECTO', entity_id: customerIds[2], amount:  7992, payment_method: 'YAPE',          bank_account: '',                         transaction_ref: 'YAPE-003',   notes: 'Pago InnoTech' },
    { payment_type: 'PAGO_PROVEEDOR', reference_type: 'DIRECTO', entity_id: supplierIds[1], amount: 25000, payment_method: 'TRANSFERENCIA', bank_account: 'Scotiabank 002-98765432',  transaction_ref: 'OP-PR-001', notes: 'Pago HP Mayoristas' },
    { payment_type: 'PAGO_PROVEEDOR', reference_type: 'DIRECTO', entity_id: supplierIds[0], amount: 40000, payment_method: 'TRANSFERENCIA', bank_account: 'Interbank 003-12345678',   transaction_ref: 'OP-PR-002', notes: 'Pago Apple Distribuidora' },
  ];
}

const STEP_DEFS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'categories', label: 'Categorías',  icon: <Tag        className="w-3 h-3" /> },
  { id: 'customers',  label: 'Clientes',    icon: <Users      className="w-3 h-3" /> },
  { id: 'suppliers',  label: 'Proveedores', icon: <Factory    className="w-3 h-3" /> },
  { id: 'warehouse',  label: 'Almacén',     icon: <Warehouse  className="w-3 h-3" /> },
  { id: 'products',   label: 'Productos',   icon: <Package    className="w-3 h-3" /> },
  { id: 'purchases',  label: 'Compras',     icon: <ClipboardList className="w-3 h-3" /> },
  { id: 'sales',      label: 'Ventas',      icon: <ShoppingCart  className="w-3 h-3" /> },
  { id: 'payments',   label: 'Pagos',       icon: <BadgeDollarSign className="w-3 h-3" /> },
  { id: 'dashboard',  label: 'Dashboard',   icon: <BarChart3  className="w-3 h-3" /> },
];

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics]                 = useState<DashboardMetrics | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting]             = useState(false);
  const [toastMessage, setToastMessage]       = useState<string | null>(null);
  const [toastType, setToastType]             = useState<'success' | 'info'>('success');

  // Inline simulation state
  const [simRunning, setSimRunning]   = useState(false);
  const [simSteps, setSimSteps]       = useState<SimStep[]>(
    STEP_DEFS.map(s => ({ ...s, status: 'pending' as StepStatus }))
  );
  const [simProgress, setSimProgress] = useState(0);
  const [simVisible, setSimVisible]   = useState(false); // show inline bar

  // ── Fetch metrics ──────────────────────────────────────────────────────────
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error al cargar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const onDataChanged = () => fetchMetrics();
    window.addEventListener('erp:data-changed', onDataChanged);
    return () => window.removeEventListener('erp:data-changed', onDataChanged);
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleResetAll = async () => {
    try {
      setResetting(true);
      await api.resetAllData();
      await fetchMetrics();
      setIsResetModalOpen(false);
      showToast('Se vaciaron todas las transacciones, compras, ventas, kardex y saldos con éxito.', 'success');
    } catch (err: any) {
      alert('Error al vaciar los datos: ' + (err.message || err));
    } finally {
      setResetting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const markStep = (id: string, status: StepStatus) => {
    setSimSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const advanceProgress = (done: number) => setSimProgress(Math.round((done / STEP_DEFS.length) * 100));

  // ── Simulation (inline, idempotent — reuses existing data) ────────────────
  const runSimulation = async () => {
    setSimSteps(STEP_DEFS.map(s => ({ ...s, status: 'pending' })));
    setSimProgress(0);
    setSimVisible(true);
    setSimRunning(true);

    let done = 0;

    // Helper: try to create, if it already exists fetch existing list and find by key
    const upsertCategory = async (cat: any): Promise<number> => {
      try { return (await api.createCategory(cat)).id; }
      catch { const all = await api.getCategories(); const f = all.find((c: any) => c.name === cat.name); return f?.id || 0; }
    };
    const upsertCustomer = async (c: any): Promise<number> => {
      try { return (await api.createCustomer(c)).id; }
      catch { const all = await api.getCustomers(); const f = all.find((x: any) => x.document_number === c.document_number); return f?.id || 0; }
    };
    const upsertSupplier = async (s: any): Promise<number> => {
      try { return (await api.createSupplier(s)).id; }
      catch { const all = await api.getSuppliers(); const f = all.find((x: any) => x.document_number === s.document_number); return f?.id || 0; }
    };
    const upsertWarehouse = async (w: any): Promise<number> => {
      try { return (await api.createWarehouse(w)).id; }
      catch { const all = await api.getWarehouses(); const f = all.find((x: any) => x.code === w.code); return f?.id || 0; }
    };
    const upsertProduct = async (p: any): Promise<number> => {
      try { return (await api.createProduct(p)).id; }
      catch { const all = await api.getProducts(); const f = all.find((x: any) => x.code === p.code); return f?.id || 0; }
    };

    try {
      // 1 · Categories
      markStep('categories', 'running');
      await delay(300);
      const catIds: number[] = [];
      for (const cat of SIM_CATEGORIES) { catIds.push(await upsertCategory(cat)); }
      markStep('categories', 'done'); advanceProgress(++done); await delay(200);

      // 2 · Customers
      markStep('customers', 'running');
      const customerIds: number[] = [];
      for (const c of SIM_CUSTOMERS) { customerIds.push(await upsertCustomer(c)); }
      markStep('customers', 'done'); advanceProgress(++done); await delay(200);

      // 3 · Suppliers
      markStep('suppliers', 'running');
      const supplierIds: number[] = [];
      for (const s of SIM_SUPPLIERS) { supplierIds.push(await upsertSupplier(s)); }
      markStep('suppliers', 'done'); advanceProgress(++done); await delay(200);

      // 4 · Warehouse
      markStep('warehouse', 'running');
      const whId: number = await upsertWarehouse(SIM_WAREHOUSE);
      markStep('warehouse', 'done'); advanceProgress(++done); await delay(200);

      // 5 · Products
      markStep('products', 'running');
      const prodIds: number[] = [];
      for (const p of buildProducts(catIds)) { prodIds.push(await upsertProduct(p)); }
      markStep('products', 'done'); advanceProgress(++done); await delay(200);

      // 6 · Purchases
      markStep('purchases', 'running');
      for (const po of buildPurchases(supplierIds, whId, prodIds)) { await api.createPurchase(po); }
      markStep('purchases', 'done'); advanceProgress(++done); await delay(200);

      // 7 · Sales
      markStep('sales', 'running');
      for (const sale of buildSales(customerIds, whId, prodIds)) { await api.createSale(sale); }
      markStep('sales', 'done'); advanceProgress(++done); await delay(200);

      // 8 · Payments
      markStep('payments', 'running');
      for (const pay of buildPayments(customerIds, supplierIds)) { await api.createPayment(pay); }
      markStep('payments', 'done'); advanceProgress(++done); await delay(200);

      // 9 · Refresh
      markStep('dashboard', 'running');
      await fetchMetrics();
      markStep('dashboard', 'done'); advanceProgress(++done);

      showToast('✅ Simulación completada — todos los módulos sincronizados y dashboard actualizado.', 'success');

      // Hide bar after 4 s
      setTimeout(() => setSimVisible(false), 4000);

    } catch (err: any) {
      setSimSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      showToast('❌ Error en la simulación: ' + (err.message || 'Verifica la conexión con el backend.'), 'info');
    } finally {
      setSimRunning(false);
    }
  };

  // ── Chart: max-based heights ───────────────────────────────────────────────
  const maxMonthVal = metrics?.sales_by_month
    ? Math.max(...metrics.sales_by_month.flatMap(m => [m.ventas, m.compras]), 1)
    : 1;

  const barH = (val: number) =>
    val > 0 ? `${Math.max(6, Math.min(100, (val / maxMonthVal) * 90))}%` : '3%';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const doneCount  = simSteps.filter(s => s.status === 'done').length;

  return (
    <div className="space-y-6">

      {/* ── Toast ── */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300 ${toastType === 'success' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold max-w-xs">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Top Banner ── */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl shadow-sky-950/20 border border-slate-800 space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-400">Panel Ejecutivo &amp; BI</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Dashboard Empresarial Cloud</h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Métricas operativas en tiempo real, trazabilidad de compras y ventas, rotación de existencias y flujo de tesorería.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {/* Simulación button */}
            <button
              id="btn-simulacion"
              onClick={runSimulation}
              disabled={simRunning}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 border border-violet-400/30 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/40 transition-all cursor-pointer text-white"
            >
              {simRunning
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              <span>{simRunning ? 'Simulando...' : 'Simulación'}</span>
            </button>

            {/* Vaciar Todo */}
            <button
              id="btn-vaciar-todo"
              onClick={() => setIsResetModalOpen(true)}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 border border-rose-500/30 rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all cursor-pointer text-white"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vaciar Todo</span>
            </button>
          </div>
        </div>

        {/* ── Inline Simulation Progress Bar ── */}
        {simVisible && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 space-y-3 animate-in fade-in duration-300">
            {/* Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 to-indigo-300 rounded-full transition-all duration-500"
                  style={{ width: `${simProgress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white/80 shrink-0 w-10 text-right">{simProgress}%</span>
            </div>

            {/* Step pills */}
            <div className="flex flex-wrap gap-1.5">
              {simSteps.map(step => (
                <span
                  key={step.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    step.status === 'done'    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' :
                    step.status === 'running' ? 'bg-violet-500/40 text-violet-100 border border-violet-400/60 animate-pulse' :
                    step.status === 'error'   ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40' :
                    'bg-white/10 text-white/40 border border-white/10'
                  }`}
                >
                  {step.status === 'done'    ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                   step.status === 'running' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> :
                   step.status === 'error'   ? <X className="w-2.5 h-2.5" /> :
                   <CircleDot className="w-2.5 h-2.5" />}
                  {step.label}
                </span>
              ))}
            </div>

            {/* Done summary */}
            {doneCount === STEP_DEFS.length && (
              <p className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simulación completada — 9 módulos sincronizados, 4 ventas, 3 compras, 5 pagos procesados.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ── Chart + Stock Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Evolución Comercial — fixed bar heights */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Evolución Comercial (Ventas vs Compras)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparativa histórica de ingresos y costos operativos</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> Ventas
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" /> Compras
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-56 flex items-end gap-2 border-b border-slate-100 dark:border-slate-800 pb-0">
            {metrics?.sales_by_month && metrics.sales_by_month.length > 0 ? (
              metrics.sales_by_month.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0 h-full justify-end">
                  <div className="w-full flex justify-center items-end gap-1 h-48">
                    {/* Ventas bar */}
                    <div
                      style={{ height: barH(item.ventas) }}
                      className="w-1/2 bg-sky-500 rounded-t-md hover:bg-sky-400 transition-all duration-500 cursor-pointer relative group"
                    >
                      {item.ventas > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow pointer-events-none">
                          S/. {item.ventas.toLocaleString()}
                        </div>
                      )}
                    </div>
                    {/* Compras bar */}
                    <div
                      style={{ height: barH(item.compras) }}
                      className="w-1/2 bg-indigo-400 rounded-t-md hover:bg-indigo-300 transition-all duration-500 cursor-pointer relative group"
                    >
                      {item.compras > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow pointer-events-none">
                          S/. {item.compras.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 truncate w-full text-center mt-1.5 pb-0">
                    {item.month}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 pb-6">
                Sin datos aún — usa <strong className="mx-1">Simulación</strong> para poblar el gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
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
                Todos los productos cuentan con stock óptimo.
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

      {/* ── Recent Sales Table ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Últimos Comprobantes de Venta</h2>
          <span className="text-xs text-slate-400">Actualizado en tiempo real</span>
        </div>
        <div className="overflow-x-auto">
          {(!metrics?.recent_sales || metrics.recent_sales.length === 0) ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No hay ventas aún. Usa el botón <strong className="text-violet-600">✦ Simulación</strong> para poblar el sistema.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics.recent_sales.map((sale: any) => (
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

      {/* ══════════════════════════════════════════════════════════
          RESET MODAL
      ══════════════════════════════════════════════════════════ */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/50 max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-4 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">¿Vaciar Todo el Sistema?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Acción administrativa irreversible</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs leading-relaxed mb-6 space-y-2">
              <p className="text-rose-900 dark:text-rose-200">Al confirmar, el sistema ejecutará un vaciado integral:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li>Se eliminarán todas las <b>Ventas y Comprobantes</b>.</li>
                <li>Se eliminarán todas las <b>Compras y Órdenes</b>.</li>
                <li>Se eliminarán todos los <b>Cobros y Pagos</b>.</li>
                <li>Se limpiará el <b>Kardex de Movimientos</b>.</li>
                <li>Saldos de clientes y proveedores → <b>S/. 0.00</b>.</li>
                <li>Stock de inventarios → <b>0 unidades</b>.</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                disabled={resetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={resetting}
                onClick={handleResetAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {resetting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Vaciando...</span></>
                  : <><Trash2 className="w-4 h-4" /><span>Sí, Vaciar Todo</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
