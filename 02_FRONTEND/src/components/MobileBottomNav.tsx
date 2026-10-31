import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  Menu
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenMenu
}) => {
  const primaryTabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
    { id: 'compras', label: 'Compras', icon: Receipt },
    { id: 'inventario', label: 'Stock', icon: Boxes },
  ];

  const isMoreActive = !primaryTabs.some(t => t.id === activeTab);

  return (
    <nav
      aria-label="Navegación Móvil"
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden px-2 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-sky-50 dark:bg-sky-950/60' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Botón Más / Menú completo */}
        <button
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isMoreActive
              ? 'text-sky-600 dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all relative ${isMoreActive ? 'bg-sky-50 dark:bg-sky-950/60' : ''}`}>
            <Menu className={`w-5 h-5 ${isMoreActive ? 'scale-110' : ''}`} />
            {isMoreActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {isMoreActive ? 'Módulo' : 'Más'}
          </span>
        </button>
      </div>
    </nav>
  );
};
