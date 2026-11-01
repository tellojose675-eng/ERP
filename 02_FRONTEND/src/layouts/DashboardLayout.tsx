import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar, NavTab } from '../components/Sidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ThemeMode } from '../utils/theme';
import { AICopilotDrawer } from '../components/AICopilotDrawer';
import { Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
  user: any;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  theme,
  onToggleTheme,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 relative">
      <Navbar
        user={user}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          userRole={user?.role}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Botón Flotante Copiloto IA (Desktop y Tablet) */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Abrir Copiloto IA de Negocio"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
          </span>
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span>Copiloto IA</span>
        </button>
      </div>

      {/* Drawer del Copiloto IA */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateTab={(tab) => {
          onTabChange(tab);
          setIsCopilotOpen(false);
        }}
        userRole={user?.role}
      />

      {/* Navegación rápida inferior exclusiva para pantallas móviles */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
};


