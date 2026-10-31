import React, { useState } from 'react';
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
  Server,
  X,
  Monitor,
  ChevronDown,
  ChevronRight,
  Lock
} from 'lucide-react';
import { hasModuleAccess } from '../utils/rolePermissions';

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

interface SidebarSection {
  id: string;
  label: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    subItems?: string[];
  }[];
}

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const sidebarSections: SidebarSection[] = [
  {
    id: 'principal',
    label: 'Panel Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Ejecutivo',
        icon: LayoutDashboard,
        subItems: ['KPIs en Tiempo Real', 'Alertas de Stock', 'Tendencias']
      }
    ]
  },
  {
    id: 'comercial',
    label: 'Gestión Comercial',
    items: [
      {
        id: 'ventas',
        label: 'Ventas & Facturación',
        icon: ShoppingCart,
        subItems: ['Cotizaciones', 'Comprobantes', 'Cobros']
      },
      {
        id: 'clientes',
        label: 'Maestro Clientes',
        icon: Users,
        subItems: ['Cartera', 'Líneas de Crédito', 'CxC']
      }
    ]
  },
  {
    id: 'operaciones',
    label: 'Operaciones & Logística',
    items: [
      {
        id: 'compras',
        label: 'Compras & Adquisiciones',
        icon: Receipt,
        subItems: ['Órdenes', 'Recepción', 'Bajo Stock']
      },
      {
        id: 'proveedores',
        label: 'Maestro Proveedores',
        icon: Building2,
        subItems: ['Cartera', 'Evaluaciones', 'CxP']
      },
      {
        id: 'inventario',
        label: 'Inventario & Kardex',
        icon: Boxes,
        subItems: ['Catálogo', 'Multi-Almacén', 'Transferencias']
      }
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas & Tesorería',
    items: [
      {
        id: 'finanzas',
        label: 'Tesorería & Pagos',
        icon: DollarSign,
        subItems: ['Flujo de Caja', 'CxC', 'CxP']
      }
    ]
  },
  {
    id: 'sistema',
    label: 'Administración del Sistema',
    items: [
      {
        id: 'documentos',
        label: 'Archivos Cloud (S3)',
        icon: FileText,
        subItems: ['Upload', 'Metadatos']
      },
      {
        id: 'auditoria',
        label: 'Auditoría & Trazabilidad',
        icon: Shield,
        subItems: ['Log de Operaciones', 'Filtros']
      },
      {
        id: 'usuarios',
        label: 'IAM & Usuarios',
        icon: UserCog,
        subItems: ['Gestión Usuarios', 'Roles']
      }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole = 'Administrador',
  isOpen = false,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Expandir todas las secciones por defecto
    const initial: Record<string, boolean> = {};
    sidebarSections.forEach(s => { initial[s.id] = true; });
    return initial;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    if (onClose) {
      onClose();
    }
  };

  // Filtrar secciones y elementos por rol
  const filteredSections = sidebarSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasModuleAccess(userRole, item.id))
    }))
    .filter(section => section.items.length > 0);

  const navContent = (
    <>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections[section.id] !== false;

          return (
            <div key={section.id} className="mb-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 mb-1 cursor-pointer group"
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  {section.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                )}
              </button>

              {/* Section Items */}
              <div
                className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const hasAccess = hasModuleAccess(userRole, item.id);

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => hasAccess && handleSelectTab(item.id)}
                        disabled={!hasAccess}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          !hasAccess
                            ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                            : isActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${
                          !hasAccess
                            ? 'text-slate-400 dark:text-slate-600'
                            : isActive
                            ? 'text-white'
                            : 'text-slate-400 dark:text-slate-400'
                        }`} />
                        <div className="flex-1 text-left min-w-0">
                          <span className="truncate block">{item.label}</span>
                          {/* Sub-items badges */}
                          {isActive && item.subItems && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.subItems.map((sub) => (
                                <span
                                  key={sub}
                                  className="inline-block px-1.5 py-0.5 text-[9px] font-medium bg-white/20 rounded-md text-white/80"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {!hasAccess && (
                          <Lock className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Role Info Footer */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
          <Shield className="w-4 h-4 shrink-0" />
          <span>Rol: {userRole}</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} módulos habilitados
        </p>
      </div>

      {/* Cloud Architecture Info Footer */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
          <Server className="w-4 h-4 shrink-0" />
          <span>Infraestructura AWS</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          EC2 Cómputo • S3 Archivos • RDS PostgreSQL 16
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar (md y superior) ── */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {navContent}
      </aside>

      {/* ── Mobile Drawer (móviles < md) ── */}
      {/* Backdrop */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === 'Escape' && onClose) onClose(); }}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Slide-out Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                ERP TechStore
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                Menú de Módulos
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {navContent}
      </aside>
    </>
  );
};
