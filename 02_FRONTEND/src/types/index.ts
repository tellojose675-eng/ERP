export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role?: {
    id: number;
    name: string;
    description?: string;
  };
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  document_type: string;
  document_number: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: number;
  document_type: string;
  document_number: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  category_id?: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  is_active: boolean;
  total_stock?: number;
  category?: Category;
  created_at: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location?: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  warehouse_id: number;
  warehouse_name?: string;
  stock: number;
  reserved_stock: number;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  movement_type: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export interface SaleDetail {
  id?: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Sale {
  id: number;
  sale_number: string;
  customer_id: number;
  customer_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  sale_date: string;
  status: 'COTIZACION' | 'PEDIDO' | 'FACTURADA' | 'ANULADA';
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  payment_status: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
  notes?: string;
  details: SaleDetail[];
}

export interface PurchaseDetail {
  id?: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: number;
  purchase_number: string;
  supplier_id: number;
  supplier_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  purchase_date: string;
  status: 'SOLICITUD' | 'ORDEN' | 'RECIBIDA' | 'FACTURADA' | 'ANULADA';
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  payment_status: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
  notes?: string;
  details: PurchaseDetail[];
}

export interface Payment {
  id: number;
  payment_number: string;
  payment_type: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
  reference_type: string;
  reference_id?: number;
  entity_id: number;
  entity_name?: string;
  amount: number;
  payment_method: string;
  bank_account?: string;
  transaction_ref?: string;
  payment_date: string;
  notes?: string;
}

export interface DocumentItem {
  id: number;
  entity_type: string;
  entity_id: number;
  filename: string;
  original_name: string;
  mime_type?: string;
  file_size?: number;
  s3_bucket?: string;
  file_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  ip_address?: string;
  status: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_sales: number;
  total_purchases: number;
  gross_profit: number;
  pending_receivables: number;
  pending_payables: number;
  low_stock_count: number;
  total_products: number;
  total_customers: number;
  recent_sales: any[];
  low_stock_products: any[];
  sales_by_month: { month: string; ventas: number; compras: number }[];
}
