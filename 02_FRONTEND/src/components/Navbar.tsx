import React from 'react';
import { Monitor, ShieldCheck, LogOut, User as UserIcon, Sun, Moon, Menu, X } from 'lucide-react';
import { ThemeMode } from '../utils/theme';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  theme,
  onToggleTheme,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Cerrar menú de módulos' : 'Abrir menú de módulos'}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}

        <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-lg tracking-tight text-slate-900 dark:text-white truncate">
              ERP TECHSTORE
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              Tecnología &amp; Hardware
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-400 dark:text-slate-400 truncate">
            Venta de Cómputo • Pantallas, Móviles, Tablets &amp; CPUs
          </p>
        </div>
      </div>

      {/* Controls & User Info */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Single Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Modo Oscuro</span>
            </>
          )}
        </button>

        {/* AWS Online Status */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>RDS &amp; S3 Online</span>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[120px] md:max-w-none">
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
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
