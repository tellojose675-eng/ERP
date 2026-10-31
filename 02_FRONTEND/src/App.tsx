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
import { hasModuleAccess } from './utils/rolePermissions';

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

  // Obtener el rol del usuario
  const userRole: string = user?.role || 'Administrador';

  // Cambio de tab con validación de permisos
  const handleTabChange = (tab: NavTab) => {
    if (hasModuleAccess(userRole, tab)) {
      setActiveTab(tab);
    }
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
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    >
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'ventas' && hasModuleAccess(userRole, 'ventas') && <SalesModule />}
      {activeTab === 'compras' && hasModuleAccess(userRole, 'compras') && <PurchasesModule />}
      {activeTab === 'inventario' && hasModuleAccess(userRole, 'inventario') && <InventoryModule />}
      {activeTab === 'clientes' && hasModuleAccess(userRole, 'clientes') && <CustomersModule userRole={userRole} />}
      {activeTab === 'proveedores' && hasModuleAccess(userRole, 'proveedores') && <SuppliersModule />}
      {activeTab === 'finanzas' && hasModuleAccess(userRole, 'finanzas') && <FinanceModule />}
      {activeTab === 'documentos' && hasModuleAccess(userRole, 'documentos') && <DocumentsPage />}
      {activeTab === 'auditoria' && hasModuleAccess(userRole, 'auditoria') && <AuditPage />}
      {activeTab === 'usuarios' && hasModuleAccess(userRole, 'usuarios') && <UsersPage />}
    </DashboardLayout>
  );
}

export default App;
