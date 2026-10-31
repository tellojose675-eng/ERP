import React, { useEffect, useState } from 'react';
import { Plus, Search, Building2, Phone, Mail, User, Download } from 'lucide-react';
import { api } from '../../services/api';
import { Supplier } from '../../types';
import { Modal } from '../../components/Modal';
import { exportToCSV } from '../../utils/exportToCSV';

export const SuppliersModule: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [docType, setDocType] = useState('RUC');
  const [docNum, setDocNum] = useState('');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
    const handleDataChanged = () => {
      loadSuppliers();
    };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier({
        document_type: docType,
        document_number: docNum,
        name,
        contact_name: contactName,
        email,
        phone,
        address
      });
      setIsModalOpen(false);
      setDocNum('');
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Error al registrar proveedor');
    }
  };

  const handleExportCSV = () => {
    const exportData = filtered.map(s => ({
      TipoDoc: s.document_type,
      NumeroDoc: s.document_number,
      Proveedor: s.name,
      Contacto: s.contact_name || '',
      Email: s.email || '',
      Telefono: s.phone || '',
      Direccion: s.address || '',
      DeudaPendiente_CxP: s.current_balance
    }));
    exportToCSV(exportData, 'cartera_proveedores');
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.document_number.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Maestro de Proveedores</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestión de alianzas, mayoristas, fabricantes y cuentas por pagar.</p>
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
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Proveedor</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por razón social o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Documento</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Proveedor / Empresa</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Contacto Directo</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Teléfono / Email</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Dirección</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Por Pagar (CxP)</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                    <span className="text-[10px] text-slate-400 mr-1">{s.document_type}:</span>{s.document_number}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {s.contact_name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      {s.email && <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><Mail className="w-3 h-3" /> {s.email}</span>}
                      {s.phone && <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><Phone className="w-3 h-3" /> {s.phone}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">{s.address || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    S/. {s.current_balance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Homologado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Proveedor"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo Doc.</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="RUC">RUC</option>
                <option value="NIT">NIT</option>
                <option value="TAX_ID">Tax ID</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Número Documento</label>
              <input
                type="text"
                required
                value={docNum}
                onChange={(e) => setDocNum(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Razón Social</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Persona de Contacto</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dirección / Sede</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              Registrar Proveedor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
