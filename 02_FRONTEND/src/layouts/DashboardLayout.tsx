import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar, NavTab } from '../components/Sidebar';
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
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        user={user}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} userRole={user?.role} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
