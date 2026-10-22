import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Building2,
  DollarSign,
  FileText,
  Shield,
  UserCog,
  Server
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'ventas'
  | 'compras'
  | 'inventario'
  | 'clientes'
  | 'proveedores'
  | 'finanzas'
  | 'documentos'
  | 'auditoria'
  | 'usuarios';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
    { id: 'ventas', label: 'Comercial & Ventas', icon: ShoppingCart },
    { id: 'compras', label: 'Compras & Adquisiciones', icon: Receipt },
    { id: 'inventario', label: 'Inventario & Kardex', icon: Boxes },
    { id: 'clientes', label: 'Maestro Clientes', icon: Users },
    { id: 'proveedores', label: 'Maestro Proveedores', icon: Building2 },
    { id: 'finanzas', label: 'Finanzas & Tesorería', icon: DollarSign },
    { id: 'documentos', label: 'Archivos Cloud (S3)', icon: FileText },
    { id: 'auditoria', label: 'Auditoría & Trazabilidad', icon: Shield },
    { id: 'usuarios', label: 'Administración & IAM', icon: UserCog, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-3">
          Módulos Principales
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.adminOnly && userRole !== 'Administrador') return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as NavTab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Cloud Architecture Info Footer */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
          <Server className="w-4 h-4" />
          <span>Infraestructura AWS</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          EC2 Cómputo • S3 Archivos • RDS PostgreSQL 16
        </p>
      </div>
    </aside>
  );
};
