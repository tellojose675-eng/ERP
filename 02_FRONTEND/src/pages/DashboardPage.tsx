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
  Trash2,
  AlertOctagon,
  X,
  Play,
  Loader2,
  Sparkles,
  Tag,
  Users,
  Factory,
  Warehouse,
  Package,
  ClipboardList,
  BadgeDollarSign,
  Coins,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { StockStatusBadge, StockQuantityPill } from '../components/StockStatusBadge';

// ────────────────────────────────────────────────────────────────────────────────
// Simulation types & data
// ────────────────────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface SimStep {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  status: StepStatus;
  result?: string;
}

const today = new Date().toISOString().split('T')[0];

const SIM_CATEGORIES = [
  { name: 'Laptops & Computadoras', description: 'Equipos portátiles y workstations' },
  { name: 'Smartphones & Celulares', description: 'Teléfonos inteligentes de alta gama' },
  { name: 'Tablets & iPads', description: 'Dispositivos tableta multifuncionales' },
  { name: 'Monitores & Pantallas', description: 'Pantallas profesionales y gaming' },
  { name: 'Componentes & CPUs', description: 'Procesadores y componentes de ensamblaje' },
];

const SIM_CUSTOMERS = [
  { document_type: 'RUC', document_number: '20512345671', name: 'Tech Solutions SAC',    email: 'compras@techsolutions.pe',  phone: '01-4123456', address: 'Av. Javier Prado Este 1234, San Isidro',  credit_limit: 50000 },
  { document_type: 'RUC', document_number: '20601234562', name: 'Digital Corp SRL',       email: 'contacto@digitalcorp.pe',    phone: '01-5678901', address: 'Jr. de la Unión 456, Cercado de Lima',    credit_limit: 30000 },
  { document_type: 'RUC', document_number: '20702345673', name: 'InnoTech EIRL',          email: 'gerencia@innotech.pe',       phone: '999-111-222', address: 'Av. Arequipa 789, Miraflores',            credit_limit: 20000 },
  { document_type: 'DNI', document_number: '45678912',    name: 'Carlos Mendoza Quispe',  email: 'carlos.mendoza@gmail.com',   phone: '987-654-321', address: 'Jr. Huallaga 100, Lima',                  credit_limit: 10000 },
];

const SIM_SUPPLIERS = [
  { document_type: 'RUC', document_number: '20100123451', name: 'Apple Distribuidora Perú SAC',  contact_name: 'María García',   email: 'ventas@appledist.pe',   phone: '01-2001234', address: 'Av. La Marina 2000, San Miguel',             credit_limit: 200000 },
  { document_type: 'RUC', document_number: '20200234562', name: 'HP Mayoristas Perú SRL',        contact_name: 'Roberto Silva',  email: 'pedidos@hpmay.pe',      phone: '01-3002345', address: 'Av. Venezuela 3600, Breña',                  credit_limit: 150000 },
  { document_type: 'RUC', document_number: '20300345673', name: 'Samsung Electronics Perú',     contact_name: 'Ana Torres',     email: 'b2b@samsung.pe',        phone: '01-4003456', address: 'Av. República de Panamá 3030, San Isidro',   credit_limit: 180000 },
];

const SIM_WAREHOUSE = { code: 'ALM-001', name: 'Almacén Principal Lima', location: 'Av. Venezuela 3600, Breña, Lima' };

// Products are created dynamically after we have category IDs
function buildProducts(catIds: number[]) {
  return [
    { code: 'LAP-HP-001', name: 'Laptop HP Pavilion 15 Core i5',    description: 'Intel Core i5-12450H, 8GB RAM, 512GB SSD, 15.6" FHD',  category_id: catIds[0], unit: 'UND', purchase_price: 1800, sale_price: 2499, min_stock: 3 },
    { code: 'IPH-15-001', name: 'iPhone 15 Pro 256GB Natural',       description: 'Chip A17 Pro, Titanio Natural, Triple cámara 48MP',     category_id: catIds[1], unit: 'UND', purchase_price: 3200, sale_price: 4299, min_stock: 5 },
    { code: 'TAB-IP-001', name: 'iPad Air M2 11" WiFi 256GB',        description: 'Chip Apple M2, Pantalla Liquid Retina 11", USB-C',      category_id: catIds[2], unit: 'UND', purchase_price: 1600, sale_price: 2199, min_stock: 3 },
    { code: 'MON-LG-001', name: 'Monitor LG 27UK850 27" 4K UHD',    description: '4K 3840x2160, IPS, USB-C 60W, HDR10, 99% sRGB',        category_id: catIds[3], unit: 'UND', purchase_price:  900, sale_price: 1299, min_stock: 2 },
    { code: 'CPU-IN-001', name: 'Procesador Intel Core i7-13700K',   description: '16 núcleos, 5.4 GHz Max Turbo, Socket LGA1700, 125W',  category_id: catIds[4], unit: 'UND', purchase_price:  750, sale_price:  999, min_stock: 5 },
  ];
}

// Purchases built after supplier + warehouse + product IDs are known
function buildPurchases(supplierIds: number[], whId: number, prodIds: number[]) {
  return [
    {
      supplier_id: supplierIds[1], warehouse_id: whId, status: 'RECIBIDA',
      notes: 'OC-001 · Reposición de Laptops HP y CPUs Intel — Simulación ERP',
      items: [
        { product_id: prodIds[0], quantity: 10, unit_price: 1800 },
        { product_id: prodIds[4], quantity: 20, unit_price: 750  },
      ],
    },
    {
      supplier_id: supplierIds[0], warehouse_id: whId, status: 'RECIBIDA',
      notes: 'OC-002 · Importación Apple iPhones e iPads — Simulación ERP',
      items: [
        { product_id: prodIds[1], quantity: 15, unit_price: 3200 },
        { product_id: prodIds[2], quantity: 10, unit_price: 1600 },
      ],
    },
    {
      supplier_id: supplierIds[2], warehouse_id: whId, status: 'RECIBIDA',
      notes: 'OC-003 · Monitores Samsung 4K para tienda — Simulación ERP',
      items: [
        { product_id: prodIds[3], quantity: 12, unit_price: 900 },
      ],
    },
  ];
}

// Sales built after customer + warehouse + product IDs are known
function buildSales(customerIds: number[], whId: number, prodIds: number[]) {
  return [
    {
      customer_id: customerIds[0], warehouse_id: whId, status: 'FACTURADA',
      notes: 'VTA-001 · Equipamiento corporativo para oficinas — Simulación ERP',
      items: [
        { product_id: prodIds[0], quantity: 3, unit_price: 2499 },
        { product_id: prodIds[3], quantity: 4, unit_price: 1299 },
      ],
    },
    {
      customer_id: customerIds[1], warehouse_id: whId, status: 'FACTURADA',
      notes: 'VTA-002 · Renovación de smartphones ejecutivos — Simulación ERP',
      items: [
        { product_id: prodIds[1], quantity: 5, unit_price: 4299 },
        { product_id: prodIds[2], quantity: 2, unit_price: 2199 },
      ],
    },
    {
      customer_id: customerIds[2], warehouse_id: whId, status: 'FACTURADA',
      notes: 'VTA-003 · Ensamblaje de PCs gamer con CPUs Intel — Simulación ERP',
      items: [
        { product_id: prodIds[4], quantity: 8, unit_price: 999  },
        { product_id: prodIds[0], quantity: 2, unit_price: 2499 },
      ],
    },
    {
      customer_id: customerIds[3], warehouse_id: whId, status: 'FACTURADA',
      notes: 'VTA-004 · Compra personal de tecnología premium — Simulación ERP',
      items: [
        { product_id: prodIds[1], quantity: 1, unit_price: 4299 },
        { product_id: prodIds[2], quantity: 1, unit_price: 2199 },
        { product_id: prodIds[4], quantity: 3, unit_price: 999  },
      ],
    },
  ];
}

// Payments built after customer + supplier IDs
function buildPayments(customerIds: number[], supplierIds: number[]) {
  return [
    { payment_type: 'COBRO_CLIENTE', reference_type: 'DIRECTO', entity_id: customerIds[0], amount: 12000,  payment_method: 'TRANSFERENCIA', bank_account: 'BCP Soles Cta Cte 191-23849180-12', transaction_ref: 'OP-TC-001', notes: 'Abono parcial venta corporativa Tech Solutions' },
    { payment_type: 'COBRO_CLIENTE', reference_type: 'DIRECTO', entity_id: customerIds[1], amount: 18000,  payment_method: 'DEPOSITO',      bank_account: 'BBVA Soles 0011-0175-01-00234567',  transaction_ref: 'OP-TC-002', notes: 'Cobro smartphones Digital Corp' },
    { payment_type: 'COBRO_CLIENTE', reference_type: 'DIRECTO', entity_id: customerIds[2], amount: 7992,   payment_method: 'YAPE',          bank_account: '',                                  transaction_ref: 'YAPE-003',   notes: 'Pago CPUs InnoTech EIRL' },
    { payment_type: 'PAGO_PROVEEDOR', reference_type: 'DIRECTO', entity_id: supplierIds[1], amount: 25000,  payment_method: 'TRANSFERENCIA', bank_account: 'Scotiabank Soles 002-98765432',      transaction_ref: 'OP-PR-001', notes: 'Pago parcial OC Laptops HP Mayoristas' },
    { payment_type: 'PAGO_PROVEEDOR', reference_type: 'DIRECTO', entity_id: supplierIds[0], amount: 40000,  payment_method: 'TRANSFERENCIA', bank_account: 'Interbank Soles 003-12345678',       transaction_ref: 'OP-PR-002', notes: 'Pago Apple Distribuidora — iPhones y iPads' },
  ];
}

const INITIAL_STEPS: SimStep[] = [
  { id: 'categories', label: 'Categorías de productos',     detail: '5 categorías TechStore',       icon: <Tag className="w-4 h-4" />,              status: 'pending' },
  { id: 'customers',  label: 'Clientes corporativos',       detail: '4 clientes con crédito',        icon: <Users className="w-4 h-4" />,            status: 'pending' },
  { id: 'suppliers',  label: 'Proveedores mayoristas',      detail: '3 distribuidoras',              icon: <Factory className="w-4 h-4" />,          status: 'pending' },
  { id: 'warehouse',  label: 'Almacén principal',           detail: 'ALM-001 · Lima',                icon: <Warehouse className="w-4 h-4" />,        status: 'pending' },
  { id: 'products',   label: 'Catálogo de productos',       detail: '5 SKUs tecnología',             icon: <Package className="w-4 h-4" />,          status: 'pending' },
  { id: 'purchases',  label: 'Órdenes de compra',           detail: '3 OC recibidas en almacén',     icon: <ClipboardList className="w-4 h-4" />,    status: 'pending' },
  { id: 'sales',      label: 'Comprobantes de venta',       detail: '4 facturas emitidas',           icon: <ShoppingCart className="w-4 h-4" />,     status: 'pending' },
  { id: 'payments',   label: 'Cobros y pagos tesorería',    detail: '5 movimientos financieros',     icon: <BadgeDollarSign className="w-4 h-4" />,  status: 'pending' },
  { id: 'dashboard',  label: 'Actualizando métricas',       detail: 'Recalculando dashboard BI',     icon: <BarChart3 className="w-4 h-4" />,        status: 'pending' },
];

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulation state
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [simSteps, setSimSteps] = useState<SimStep[]>(INITIAL_STEPS.map(s => ({ ...s })));
  const [simRunning, setSimRunning] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [simSummary, setSimSummary] = useState<{ ventas: number; compras: number; pagos: number } | null>(null);

  // ── Fetch metrics ──
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
    const handleDataChanged = () => fetchMetrics();
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => window.removeEventListener('erp:data-changed', handleDataChanged);
  }, []);

  // ── Reset handler ──
  const handleResetAll = async () => {
    try {
      setResetting(true);
      await api.resetAllData();
      await fetchMetrics();
      setIsResetModalOpen(false);
      setToastMessage('Se vaciaron todas las transacciones, compras, ventas, kardex y saldos con éxito.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      alert('Error al vaciar los datos: ' + (err.message || err));
    } finally {
      setResetting(false);
    }
  };

  // ── Simulation helpers ──
  const updateStep = (id: string, patch: Partial<SimStep>) => {
    setSimSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const openSim = () => {
    setSimSteps(INITIAL_STEPS.map(s => ({ ...s })));
    setSimRunning(false);
    setSimDone(false);
    setSimSummary(null);
    setIsSimOpen(true);
  };

  // ── Run simulation ──
  const runSimulation = async () => {
    setSimRunning(true);

    try {
      // ── Step 1: Categories ──────────────────────────────────────────────────
      updateStep('categories', { status: 'running' });
      await delay(400);
      const catIds: number[] = [];
      for (const cat of SIM_CATEGORIES) {
        const res = await api.createCategory(cat);
        catIds.push(res.id);
      }
      updateStep('categories', { status: 'done', result: `${catIds.length} categorías creadas` });
      await delay(300);

      // ── Step 2: Customers ───────────────────────────────────────────────────
      updateStep('customers', { status: 'running' });
      await delay(400);
      const customerIds: number[] = [];
      for (const cust of SIM_CUSTOMERS) {
        const res = await api.createCustomer(cust);
        customerIds.push(res.id);
      }
      updateStep('customers', { status: 'done', result: `${customerIds.length} clientes registrados` });
      await delay(300);

      // ── Step 3: Suppliers ───────────────────────────────────────────────────
      updateStep('suppliers', { status: 'running' });
      await delay(400);
      const supplierIds: number[] = [];
      for (const sup of SIM_SUPPLIERS) {
        const res = await api.createSupplier(sup);
        supplierIds.push(res.id);
      }
      updateStep('suppliers', { status: 'done', result: `${supplierIds.length} proveedores registrados` });
      await delay(300);

      // ── Step 4: Warehouse ───────────────────────────────────────────────────
      updateStep('warehouse', { status: 'running' });
      await delay(400);
      const wh = await api.createWarehouse(SIM_WAREHOUSE);
      const whId: number = wh.id;
      updateStep('warehouse', { status: 'done', result: `${wh.name} (ID: ${whId})` });
      await delay(300);

      // ── Step 5: Products ────────────────────────────────────────────────────
      updateStep('products', { status: 'running' });
      await delay(400);
      const prodIds: number[] = [];
      for (const prod of buildProducts(catIds)) {
        const res = await api.createProduct(prod);
        prodIds.push(res.id);
      }
      updateStep('products', { status: 'done', result: `${prodIds.length} SKUs en catálogo` });
      await delay(300);

      // ── Step 6: Purchases ───────────────────────────────────────────────────
      updateStep('purchases', { status: 'running' });
      await delay(400);
      let totalCompras = 0;
      for (const po of buildPurchases(supplierIds, whId, prodIds)) {
        const res = await api.createPurchase(po);
        totalCompras += res.total || 0;
      }
      updateStep('purchases', { status: 'done', result: `3 OC · S/. ${totalCompras.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` });
      await delay(300);

      // ── Step 7: Sales ───────────────────────────────────────────────────────
      updateStep('sales', { status: 'running' });
      await delay(400);
      let totalVentas = 0;
      for (const sale of buildSales(customerIds, whId, prodIds)) {
        const res = await api.createSale(sale);
        totalVentas += res.total || 0;
      }
      updateStep('sales', { status: 'done', result: `4 facturas · S/. ${totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` });
      await delay(300);

      // ── Step 8: Payments ────────────────────────────────────────────────────
      updateStep('payments', { status: 'running' });
      await delay(400);
      let totalPagos = 0;
      for (const pay of buildPayments(customerIds, supplierIds)) {
        await api.createPayment(pay);
        totalPagos += pay.amount;
      }
      updateStep('payments', { status: 'done', result: `5 movimientos · S/. ${totalPagos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` });
      await delay(300);

      // ── Step 9: Refresh dashboard ───────────────────────────────────────────
      updateStep('dashboard', { status: 'running' });
      await delay(500);
      await fetchMetrics();
      updateStep('dashboard', { status: 'done', result: 'Métricas actualizadas en tiempo real' });

      setSimSummary({ ventas: totalVentas, compras: totalCompras, pagos: totalPagos });
      setSimDone(true);
      setToastMessage('✅ Simulación completada — todos los módulos están sincronizados y operativos.');
      setTimeout(() => setToastMessage(null), 6000);

    } catch (err: any) {
      // Mark currently running step as error
      setSimSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', result: err.message || 'Error inesperado' } : s));
    } finally {
      setSimRunning(false);
    }
  };

  // ── Loading skeleton ──
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const doneCount = simSteps.filter(s => s.status === 'done').length;
  const progress = Math.round((doneCount / simSteps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Top Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-sky-950/20 border border-slate-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Panel Ejecutivo &amp; BI</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Dashboard Empresarial Cloud</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Métricas operativas en tiempo real, trazabilidad de compras y ventas, rotación de existencias y flujo de tesorería conectado.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          {/* ── Simulation Button ── */}
          <button
            id="btn-simulacion"
            onClick={openSim}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/30 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/40 transition-all cursor-pointer text-white"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulación</span>
          </button>

          {/* ── Vaciar Todo ── */}
          <button
            id="btn-vaciar-todo"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 border border-rose-500/30 rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all cursor-pointer text-white"
            title="Vaciar todas las operaciones y resetear el sistema"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vaciar Todo</span>
          </button>
        </div>
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

      {/* ── Charts + Stock Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* ── Recent Sales Table ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Últimos Comprobantes de Venta</h2>
          <span className="text-xs text-slate-400">Actualizado automáticamente en tiempo real</span>
        </div>
        <div className="overflow-x-auto">
          {(!metrics?.recent_sales || metrics.recent_sales.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay ventas registradas aún. Usa el botón <strong>Simulación</strong> para poblar el sistema con datos de demostración.
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

      {/* ══════════════════════════════════════════════════════════════════════
          SIMULATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_70%)]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold leading-tight">Simulación ERP</h2>
                      <p className="text-xs text-white/70">Todos los módulos conectados</p>
                    </div>
                  </div>
                  {!simRunning && (
                    <button
                      onClick={() => setIsSimOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
                    <span>{simRunning ? 'Ejecutando...' : simDone ? '¡Completado!' : 'Listo para iniciar'}</span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Steps list */}
            <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
              {simSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    step.status === 'done'    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' :
                    step.status === 'running' ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800' :
                    step.status === 'error'   ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' :
                    'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Status icon */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    step.status === 'done'    ? 'bg-emerald-500 text-white' :
                    step.status === 'running' ? 'bg-violet-500 text-white' :
                    step.status === 'error'   ? 'bg-rose-500 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {step.status === 'done'    ? <CheckCircle2 className="w-4 h-4" /> :
                     step.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     step.status === 'error'   ? <X className="w-4 h-4" /> :
                     <CircleDot className="w-4 h-4" />}
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${
                      step.status === 'done'    ? 'text-emerald-800 dark:text-emerald-300' :
                      step.status === 'running' ? 'text-violet-800 dark:text-violet-300' :
                      step.status === 'error'   ? 'text-rose-800 dark:text-rose-300' :
                      'text-slate-500 dark:text-slate-400'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {step.result || step.detail}
                    </div>
                  </div>

                  {/* Module icon */}
                  <div className={`shrink-0 ${
                    step.status === 'done'    ? 'text-emerald-400' :
                    step.status === 'running' ? 'text-violet-400' :
                    'text-slate-300 dark:text-slate-600'
                  }`}>
                    {step.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary / Actions */}
            <div className="px-5 pb-5">
              {simDone && simSummary && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl p-3 text-center border border-sky-200 dark:border-sky-800">
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wide">Ventas</div>
                    <div className="text-sm font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">
                      S/. {(simSummary.ventas / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-3 text-center border border-indigo-200 dark:border-indigo-800">
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Compras</div>
                    <div className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5">
                      S/. {(simSummary.compras / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">Cobros</div>
                    <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      S/. {(simSummary.pagos / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!simRunning && !simDone && (
                  <>
                    <button
                      onClick={() => setIsSimOpen(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      id="btn-iniciar-simulacion"
                      onClick={runSimulation}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 cursor-pointer transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Iniciar Simulación
                    </button>
                  </>
                )}

                {simRunning && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando... por favor espera
                  </div>
                )}

                {simDone && (
                  <button
                    onClick={() => setIsSimOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Ver Dashboard Actualizado
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RESET MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/50 max-w-lg w-full p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-4 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">¿Vaciar Todo el Sistema?</h3>
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
                <li>El stock de inventarios se restablecerá a <b>0 unidades</b>.</li>
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
                    <Loader2 className="w-4 h-4 animate-spin" />
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
