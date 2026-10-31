import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar, NavTab } from '../components/Sidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ThemeMode } from '../utils/theme';

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        user={user}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
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

