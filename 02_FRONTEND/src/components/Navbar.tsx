import React from 'react';
import { Monitor, ShieldCheck, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../utils/theme';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, theme, onToggleTheme }) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Brand & AWS Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Monitor className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">ERP TECHSTORE</span>
            <span className="text-[10px] font-semibold uppercase bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
              Tecnología & Hardware
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400">Venta de Cómputo • Pantallas, Móviles, Tablets & CPUs</p>
        </div>
      </div>

      {/* Controls & User Info */}
      <div className="flex items-center gap-4">
        {/* Single Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>

        {/* AWS Online Status */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>RDS & S3 Online</span>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {user?.full_name || user?.username || 'Usuario'}
            </div>
            <div className="text-xs text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user?.role || 'Administrador'}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
