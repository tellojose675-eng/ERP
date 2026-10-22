import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, CreditCard, Download } from 'lucide-react';
import { api } from '../../services/api';
import { Payment, Customer, Supplier } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';

export const FinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'cxc' | 'cxp'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cxcList, setCxcList] = useState<any[]>([]);
  const [cxpList, setCxpList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [paymentType, setPaymentType] = useState<'COBRO_CLIENTE' | 'PAGO_PROVEEDOR'>('COBRO_CLIENTE');
  const [entityId, setEntityId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(100);
  const [method, setMethod] = useState<string>('TRANSFERENCIA');
  const [bankAccount, setBankAccount] = useState<string>('BCP Soles Cta Cte 191-2384918-0-12');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pay, cxc, cxp, cust, supp] = await Promise.all([
        api.getPayments(),
        api.getAccountsReceivable(),
        api.getAccountsPayable(),
        api.getCustomers(),
        api.getSuppliers()
      ]);
      setPayments(pay);
      setCxcList(cxc);
      setCxpList(cxp);
      setCustomers(cust);
      setSuppliers(supp);
      if (cust.length > 0) setEntityId(cust[0].id);
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
    };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, []);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPayment({
        payment_type: paymentType,
        reference_type: 'DIRECTO',
        entity_id: entityId,
        amount,
        payment_method: method,
        bank_account: bankAccount,
        transaction_ref: transactionRef,
        notes
      });
      setIsModalOpen(false);
      setAmount(100);
      setTransactionRef('');
      setNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al procesar movimiento financiero');
    }
  };

  const openPaymentForEntity = (type: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR', id: number, balance: number) => {
    setPaymentType(type);
    setEntityId(id);
    setAmount(balance);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (activeTab === 'payments') {
      const exportData = payments.map(p => ({
        NumeroVoucher: p.payment_number,
        Tipo: p.payment_type,
        Entidad: p.entity_name,
        MedioPago: p.payment_method,
        CuentaBancaria: p.bank_account || '',
        ReferenciaOp: p.transaction_ref || '',
        Fecha: new Date(p.payment_date).toLocaleString(),
        Monto: p.amount
      }));
      exportToCSV(exportData, 'movimientos_tesoreria');
    } else if (activeTab === 'cxc') {
      const exportData = cxcList.map(c => ({
        Cliente: c.customer_name,
        Documento: c.document,
        LimiteCredito: c.credit_limit,
        SaldoPendiente_CxC: c.balance
      }));
      exportToCSV(exportData, 'cuentas_por_cobrar_cxc');
    } else if (activeTab === 'cxp') {
      const exportData = cxpList.map(s => ({
        Proveedor: s.supplier_name,
        Documento: s.document,
        LimiteCredito: s.credit_limit,
        ObligacionPendiente_CxP: s.balance
      }));
      exportToCSV(exportData, 'cuentas_por_pagar_cxp');
    }
  };

  const totalCobrado = payments
    .filter(p => p.payment_type === 'COBRO_CLIENTE')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalPagado = payments
    .filter(p => p.payment_type === 'PAGO_PROVEEDOR')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Finanzas & Tesorería</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Flujo de caja, cobranzas (CxC), pagos a proveedores (CxP) y conciliación.</p>
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cobranzas Percibidas</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">S/. {totalCobrado.toFixed(2)}</div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ingresos registrados
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pagos Efectuados</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">S/. {totalPagado.toFixed(2)}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Desembolsos
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Flujo Neto en Bancos</span>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              S/. {(totalCobrado - totalPagado).toFixed(2)}
            </div>
            <span className="text-[11px] text-sky-700 dark:text-sky-400/80 font-semibold mt-1 block">Saldo de liquidez</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'payments' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Historial de Movimientos
        </button>
        <button
          onClick={() => setActiveTab('cxc')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'cxc' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Cuentas por Cobrar (Clientes)
        </button>
        <button
          onClick={() => setActiveTab('cxp')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'cxp' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Cuentas por Pagar (Proveedores)
        </button>
      </div>

      {/* Tab 1: Historial */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">N° Recibo / Voucher</th>
                <th className="py-3.5 px-4">Operación</th>
                <th className="py-3.5 px-4">Beneficiario / Emisor</th>
                <th className="py-3.5 px-4">Medio de Pago</th>
                <th className="py-3.5 px-4">Referencia Bancaria</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => {
                const isCobro = p.payment_type === 'COBRO_CLIENTE';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">{p.payment_number}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        isCobro ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {isCobro ? 'Cobranza (CxC)' : 'Pago (CxP)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{p.entity_name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{p.payment_method}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{p.transaction_ref || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(p.payment_date).toLocaleString()}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${isCobro ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      S/. {p.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: CxC */}
      {activeTab === 'cxc' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4 text-right">Límite Otorgado</th>
                <th className="py-3.5 px-4 text-right">Saldo Deudor Pendiente</th>
                <th className="py-3.5 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cxcList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.customer_name}</td>
                  <td className="py-3 px-4 font-mono">{item.document}</td>
                  <td className="py-3 px-4 text-right font-mono">S/. {item.credit_limit.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    S/. {item.balance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openPaymentForEntity('COBRO_CLIENTE', item.customer_id, item.balance)}
                      className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold rounded-xl text-[11px] transition-colors border border-emerald-200 dark:border-emerald-800"
                    >
                      Registrar Cobro
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: CxP */}
      {activeTab === 'cxp' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4 text-right">Límite Otorgado</th>
                <th className="py-3.5 px-4 text-right">Obligación Pendiente</th>
                <th className="py-3.5 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cxpList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.supplier_name}</td>
                  <td className="py-3 px-4 font-mono">{item.document}</td>
                  <td className="py-3 px-4 text-right font-mono">S/. {item.credit_limit.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    S/. {item.balance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openPaymentForEntity('PAGO_PROVEEDOR', item.supplier_id, item.balance)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold rounded-xl text-[11px] transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      Emitir Pago
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={paymentType === 'COBRO_CLIENTE' ? 'Registrar Cobranza a Cliente' : 'Registrar Pago a Proveedor'}
      >
        <form onSubmit={handleCreatePayment} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento</label>
            <select
              value={paymentType}
              onChange={(e) => {
                const t = e.target.value as any;
                setPaymentType(t);
                if (t === 'COBRO_CLIENTE' && customers.length > 0) setEntityId(customers[0].id);
                if (t === 'PAGO_PROVEEDOR' && suppliers.length > 0) setEntityId(suppliers[0].id);
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="COBRO_CLIENTE">Cobranza / Cobro a Cliente (Ingreso)</option>
              <option value="PAGO_PROVEEDOR">Pago a Proveedor (Egreso)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {paymentType === 'COBRO_CLIENTE' ? 'Cliente' : 'Proveedor'}
            </label>
            <select
              required
              value={entityId}
              onChange={(e) => setEntityId(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            >
              {paymentType === 'COBRO_CLIENTE'
                ? customers.map(c => <option key={c.id} value={c.id}>{c.name} (Saldo: S/. {c.current_balance})</option>)
                : suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Saldo: S/. {s.current_balance})</option>)
              }
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto (S/.)</label>
              <input
                type="number"
                step="0.01"
                min="0.10"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Medio de Pago</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo / Caja Chica</option>
                <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                <option value="CHEQUE">Cheque de Gerencia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cuenta Bancaria de Tesorería</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">N° Operación / Referencia</label>
            <input
              type="text"
              placeholder="ej: OP-894129"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20"
            >
              Procesar Asiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
