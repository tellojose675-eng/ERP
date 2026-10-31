/**
 * rolePermissions.ts
 * Define los permisos de acceso a módulos por cada rol del sistema.
 * Los vendedores (Gerente Comercial) no pueden ver datos sensibles de clientes.
 */

import { NavTab } from '../components/Sidebar';

// Definición de secciones del sidebar
export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarMenuItem[];
}

export interface SidebarMenuItem {
  id: NavTab;
  label: string;
  description?: string;
  adminOnly?: boolean;
}

/**
 * Mapa de módulos accesibles por cada rol.
 * "Administrador" tiene acceso a TODO por defecto.
 */
export const ROLE_MODULES: Record<string, NavTab[]> = {
  'Administrador': [
    'dashboard', 'ventas', 'compras', 'inventario',
    'clientes', 'proveedores', 'finanzas',
    'documentos', 'auditoria', 'usuarios'
  ],
  'Gerente Comercial': [
    'dashboard', 'ventas', 'clientes', 'documentos'
  ],
  'Jefe de Compras': [
    'dashboard', 'compras', 'proveedores', 'inventario', 'documentos'
  ],
  'Encargado de Almacén': [
    'dashboard', 'inventario', 'documentos'
  ],
  'Finanzas y Contabilidad': [
    'dashboard', 'finanzas', 'documentos', 'ventas', 'compras'
  ]
};

/**
 * Roles que NO pueden ver datos sensibles de clientes
 * (email, teléfono, dirección completa, etc.)
 */
export const ROLES_CUSTOMER_DATA_HIDDEN: string[] = [
  'Encargado de Almacén'
];

/**
 * Roles que solo ven datos parciales de clientes (nombre y documento, sin contacto)
 */
export const ROLES_CUSTOMER_DATA_PARTIAL: string[] = [
  'Gerente Comercial'
];

/**
 * Comprueba si un rol tiene acceso a un módulo específico.
 */
export function hasModuleAccess(role: string, module: NavTab): boolean {
  if (role === 'Administrador') return true;
  const allowedModules = ROLE_MODULES[role];
  if (!allowedModules) return false;
  return allowedModules.includes(module);
}

/**
 * Filtra los módulos a mostrar en el sidebar según el rol del usuario.
 */
export function getAccessibleModules(role: string): NavTab[] {
  if (role === 'Administrador') return ROLE_MODULES['Administrador'];
  return ROLE_MODULES[role] || ['dashboard'];
}

/**
 * Comprueba si un rol puede ver los datos completos de clientes.
 */
export function canViewFullCustomerData(role: string): boolean {
  if (role === 'Administrador') return true;
  return !ROLES_CUSTOMER_DATA_HIDDEN.includes(role) && !ROLES_CUSTOMER_DATA_PARTIAL.includes(role);
}

/**
 * Comprueba si un rol puede ver datos parciales de clientes (sin contacto sensible).
 */
export function canViewPartialCustomerData(role: string): boolean {
  if (role === 'Administrador') return true;
  if (ROLES_CUSTOMER_DATA_HIDDEN.includes(role)) return false;
  return true;
}

/**
 * Enmascara un texto sensible (ej: email, teléfono) para roles sin acceso.
 * Ejemplo: "juan@mail.com" → "j***@m***.com"
 */
export function maskSensitiveText(text: string | undefined | null, type: 'email' | 'phone' | 'address'): string {
  if (!text) return '•••';

  if (type === 'email') {
    const parts = text.split('@');
    if (parts.length === 2) {
      const user = parts[0].length > 1 ? parts[0][0] + '***' : '***';
      const domain = parts[1].length > 4 ? parts[1][0] + '***' + parts[1].slice(-4) : '***';
      return `${user}@${domain}`;
    }
    return '***@***.com';
  }

  if (type === 'phone') {
    if (text.length > 3) {
      return text.slice(0, 3) + '•••' + text.slice(-2);
    }
    return '•••••••';
  }

  if (type === 'address') {
    const words = text.split(' ');
    if (words.length > 2) {
      return words[0] + ' •••••';
    }
    return '•••••';
  }

  return '•••';
}
