import React, { useEffect, useState } from 'react';
import { UserCog, Plus, ShieldCheck, Mail, User as UserIcon, Download } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { Modal } from '../components/Modal';
import { exportToCSV } from '../utils/exportToCSV';
import { formatPeruDate } from '../utils/dateUtils';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number>(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([
        api.getUsers(),
        api.getRoles()
      ]);
      setUsers(u);
      setRoles(r);
      if (r.length > 0) setRoleId(r[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        username,
        email,
        full_name: fullName,
        password,
        role_id: roleId
      });
      setIsModalOpen(false);
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al crear usuario');
    }
  };

  const handleExportCSV = () => {
    const exportData = users.map(u => ({
      Usuario: u.username,
      NombreCompleto: u.full_name,
      Email: u.email,
      Rol: u.role?.name || '',
      Activo: u.is_active ? 'SI' : 'NO',
      FechaCreacion: formatPeruDate(u.created_at)
    }));
    exportToCSV(exportData, 'usuarios_iam');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Administración & IAM</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Control de identidad y accesos basado en roles (RBAC) y credenciales.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-slate-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Usuario</th>
              <th className="py-3.5 px-4">Nombre Completo</th>
              <th className="py-3.5 px-4">Correo Electrónico</th>
              <th className="py-3.5 px-4">Rol Asignado</th>
              <th className="py-3.5 px-4">Fecha Creación</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span>{u.username}</span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{u.full_name}</td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    <ShieldCheck className="w-3 h-3" />
                    {u.role?.name || 'Usuario'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatPeruDate(u.created_at)}</td>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Usuario del Sistema"
      >
        <form onSubmit={handleCreateUser} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de Usuario (Login)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: jzambrano"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol de Acceso (RBAC)</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-sky-800 dark:text-sky-300"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre y Apellidos</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ej: José Zambrano"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico Corporativo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej: jzambrano@enterprisecloud.com"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contraseña de Acceso</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              className="px-5 py-2.5 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white rounded-xl text-xs font-semibold"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
