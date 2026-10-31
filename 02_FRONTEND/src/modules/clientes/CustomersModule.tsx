import React, { useEffect, useState } from 'react';
import {
  Plus, Search, UserCheck, Phone, Mail, MapPin,
  Download, Upload, EyeOff, Eye, ShieldAlert, FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';
import { importCSVFlow } from '../../utils/importFromCSV';
import { canViewFullCustomerData, canViewPartialCustomerData, maskSensitiveText } from '../../utils/rolePermissions';

interface CustomersModuleProps {
  userRole?: string;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({ userRole = 'Administrador' }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Form
  const [docType, setDocType] = useState('RUC');
  const [docNum, setDocNum] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(10000);

  // Permisos según rol
  const canViewFull = canViewFullCustomerData(userRole);
  const canViewPartial = canViewPartialCustomerData(userRole);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    const handleDataChanged = () => { loadCustomers(); };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => { window.removeEventListener('erp:data-changed', handleDataChanged); };
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer({
        document_type: docType,
        document_number: docNum,
        name,
        email,
        phone,
        address,
        credit_limit: creditLimit
      });
      setIsModalOpen(false);
      setDocNum(''); setName(''); setEmail(''); setPhone(''); setAddress('');
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error al registrar cliente');
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
      // Mapear columnas CSV → campos de cliente
      let created = 0, errors = 0;
      for (const row of result.data) {
        try {
          const docT = row['TipoDoc'] || row['tipo_doc'] || row['document_type'] || 'RUC';
          const docN = row['NumeroDoc'] || row['numero_doc'] || row['document_number'] || '';
          const n = row['RazonSocial'] || row['razon_social'] || row['name'] || '';
          if (!docN || !n) { errors++; continue; }
          await api.createCustomer({
            document_type: docT,
            document_number: docN,
            name: n,
            email: row['Email'] || row['email'] || '',
            phone: row['Telefono'] || row['telefono'] || row['phone'] || '',
            address: row['Direccion'] || row['direccion'] || row['address'] || '',
            credit_limit: parseFloat(row['LimiteCredito'] || row['credit_limit'] || '0') || 0
          });
          created++;
        } catch { errors++; }
      }
      setImportResult(`✅ ${created} clientes importados${errors > 0 ? ` | ⚠️ ${errors} filas con error` : ''}`);
      loadCustomers();
    } catch (err: any) {
      setImportResult(`❌ Error al importar: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filtered.map(c => ({
      TipoDoc: c.document_type,
      NumeroDoc: c.document_number,
      RazonSocial: c.name,
      Email: c.email || '',
      Telefono: c.phone || '',
      Direccion: c.address || '',
      LimiteCredito: c.credit_limit,
      DeudaPendiente_CxC: c.current_balance
    }));
    exportToCSV(exportData, 'cartera_clientes');
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document_number.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Maestro de Clientes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cartera de clientes, líneas de crédito comercial y estados de cuenta.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          {canViewFull && (
            <button
              onClick={handleImportCSV}
              disabled={importLoading}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-60"
            >
              <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{importLoading ? 'Importando...' : 'Importar CSV'}</span>
            </button>
          )}
          {canViewFull && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Aviso de restricción de rol */}
      {!canViewFull && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <b>Acceso restringido:</b> Tu rol (<b>{userRole}</b>) no permite ver datos de contacto
            sensibles (email, teléfono, dirección). Los datos se muestran parcialmente.
          </span>
        </div>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <div className={`p-3 rounded-xl text-xs font-semibold border ${
          importResult.startsWith('✅')
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {importResult}
          <button onClick={() => setImportResult(null)} className="ml-4 underline opacity-70 hover:opacity-100">
            Cerrar
          </button>
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por razón social o RUC/DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Documento</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Razón Social / Nombre</th>
                {canViewPartial && (
                  <th className="py-3.5 px-4 whitespace-nowrap">Contacto</th>
                )}
                {canViewFull && (
                  <th className="py-3.5 px-4 whitespace-nowrap">Dirección</th>
                )}
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Límite Crédito</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Deuda Actual (CxC)</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Cargando clientes...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No se encontraron clientes.</td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                    <span className="text-[10px] text-slate-400 mr-1">{c.document_type}:</span>{c.document_number}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{c.name}</td>
                  {canViewPartial && (
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        {c.email && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Mail className="w-3 h-3" />
                            {canViewFull
                              ? c.email
                              : <span className="italic opacity-60">{maskSensitiveText(c.email, 'email')}</span>
                            }
                          </span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3" />
                            {canViewFull
                              ? c.phone
                              : <span className="italic opacity-60">{maskSensitiveText(c.phone, 'phone')}</span>
                            }
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {canViewFull && (
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {c.address || '-'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right font-mono">
                    {canViewFull
                      ? `S/. ${c.credit_limit.toFixed(2)}`
                      : <span className="text-slate-400">••••</span>
                    }
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    {canViewFull
                      ? `S/. ${c.current_balance.toFixed(2)}`
                      : <span className="text-slate-400">••••</span>
                    }
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Cliente Comercial">
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo Doc.</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100">
                <option value="RUC">RUC</option>
                <option value="DNI">DNI</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Número Documento</label>
              <input type="text" required value={docNum} onChange={(e) => setDocNum(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre o Razón Social</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dirección Fiscal</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Límite de Crédito (S/.)</label>
            <input type="number" step="100" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              Cancelar
            </button>
            <button type="submit"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer">
              Registrar Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
