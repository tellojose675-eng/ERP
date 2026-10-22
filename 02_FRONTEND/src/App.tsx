import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { SalesModule } from './modules/ventas/SalesModule';
import { PurchasesModule } from './modules/compras/PurchasesModule';
import { InventoryModule } from './modules/inventario/InventoryModule';
import { CustomersModule } from './modules/clientes/CustomersModule';
import { SuppliersModule } from './modules/proveedores/SuppliersModule';
import { FinanceModule } from './modules/finanzas/FinanceModule';
import { DocumentsPage } from './pages/DocumentsPage';
import { AuditPage } from './pages/AuditPage';
import { UsersPage } from './pages/UsersPage';
import { getAuthToken, removeAuthToken } from './services/api';
import { ThemeMode, getInitialTheme, applyTheme } from './utils/theme';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  useEffect(() => {
    const savedToken = getAuthToken();
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        removeAuthToken();
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={(userData) => setUser(userData)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    >
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'ventas' && <SalesModule />}
      {activeTab === 'compras' && <PurchasesModule />}
      {activeTab === 'inventario' && <InventoryModule />}
      {activeTab === 'clientes' && <CustomersModule />}
      {activeTab === 'proveedores' && <SuppliersModule />}
      {activeTab === 'finanzas' && <FinanceModule />}
      {activeTab === 'documentos' && <DocumentsPage />}
      {activeTab === 'auditoria' && <AuditPage />}
      {activeTab === 'usuarios' && <UsersPage />}
    </DashboardLayout>
  );
}

export default App;
