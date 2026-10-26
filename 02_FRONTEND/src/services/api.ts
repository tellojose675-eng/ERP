const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const notifyDataChanged = () => {
  window.dispatchEvent(new CustomEvent('erp:data-changed'));
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error(`Error de red al conectar con ${API_BASE}${endpoint}:`, netErr);
    throw new Error(
      'No se pudo conectar con el servidor backend (puede estar despertando de inactividad o sin conexión). Por favor, espere 15 segundos y vuelva a intentarlo.'
    );
  }

  if (response.status === 401) {
    removeAuthToken();
    window.location.reload();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `Error en el servidor (${response.status})` }));
    throw new Error(errorData.detail || `Error en el servidor (${response.status})`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request<any>('/auth/me'),

  // Dashboard & Metrics
  getDashboardMetrics: () => request<any>('/dashboard/metrics'),
  resetAllData: async () => {
    const res = await request<any>('/dashboard/reset-all', { method: 'POST' });
    notifyDataChanged();
    return res;
  },

  // Clientes
  getCustomers: () => request<any[]>('/customers/'),
  createCustomer: async (data: any) => {
    const res = await request<any>('/customers/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  updateCustomer: async (id: number, data: any) => {
    const res = await request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },

  // Proveedores
  getSuppliers: () => request<any[]>('/suppliers/'),
  createSupplier: async (data: any) => {
    const res = await request<any>('/suppliers/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  updateSupplier: async (id: number, data: any) => {
    const res = await request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },

  // Productos y Categorías
  getProducts: () => request<any[]>('/products/'),
  createProduct: async (data: any) => {
    const res = await request<any>('/products/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  updateProduct: async (id: number, data: any) => {
    const res = await request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  getCategories: () => request<any[]>('/products/categories'),
  createCategory: async (data: any) => {
    const res = await request<any>('/products/categories', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },

  // Inventario
  getWarehouses: () => request<any[]>('/inventory/warehouses'),
  createWarehouse: async (data: any) => {
    const res = await request<any>('/inventory/warehouses', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  getStock: (warehouseId?: number) => request<any[]>(`/inventory/stock${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`),
  adjustStock: async (data: any) => {
    const res = await request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  transferStock: async (data: any) => {
    const res = await request<any>('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  getKardex: (productId?: number) => request<any[]>(`/inventory/movements${productId ? `?product_id=${productId}` : ''}`),

  // Ventas
  getSales: () => request<any[]>('/sales/'),
  createSale: async (data: any) => {
    const res = await request<any>('/sales/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  cancelSale: async (id: number) => {
    const res = await request<any>(`/sales/${id}/cancel`, { method: 'POST' });
    notifyDataChanged();
    return res;
  },

  // Compras
  getPurchases: () => request<any[]>('/purchases/'),
  createPurchase: async (data: any) => {
    const res = await request<any>('/purchases/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  cancelPurchase: async (id: number) => {
    const res = await request<any>(`/purchases/${id}/cancel`, { method: 'POST' });
    notifyDataChanged();
    return res;
  },

  // Finanzas y Pagos
  getPayments: () => request<any[]>('/payments/'),
  createPayment: async (data: any) => {
    const res = await request<any>('/payments/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  getAccountsReceivable: () => request<any[]>('/payments/accounts-receivable'),
  getAccountsPayable: () => request<any[]>('/payments/accounts-payable'),

  // Documentos Cloud S3
  getDocuments: (entityType?: string, entityId?: number) => {
    let q = '';
    if (entityType && entityId) q = `?entity_type=${entityType}&entity_id=${entityId}`;
    return request<any[]>(`/documents/${q}`);
  },
  uploadDocument: async (formData: FormData) => {
    const res = await request<any>('/documents/upload', { method: 'POST', body: formData });
    notifyDataChanged();
    return res;
  },
  deleteDocument: async (id: number) => {
    const res = await request<any>(`/documents/${id}`, { method: 'DELETE' });
    notifyDataChanged();
    return res;
  },

  // Auditoría
  getAuditLogs: (module?: string) => request<any[]>(`/audit/${module ? `?module=${module}` : ''}`),

  // Usuarios IAM
  getUsers: () => request<any[]>('/users/'),
  createUser: async (data: any) => {
    const res = await request<any>('/users/', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChanged();
    return res;
  },
  getRoles: () => request<any[]>('/users/roles'),
};
