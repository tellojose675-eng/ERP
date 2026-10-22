from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ================= AUTH & USUARIOS =================
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role_id: int

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role_id: int
    role: Optional[RoleOut] = None
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ================= CLIENTES =================
class CustomerCreate(BaseModel):
    document_type: str
    document_number: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: Optional[float] = 0.0

class CustomerUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None

class CustomerOut(CustomerCreate):
    id: int
    current_balance: float
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ================= PROVEEDORES =================
class SupplierCreate(BaseModel):
    document_type: str
    document_number: str
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: Optional[float] = 0.0

class SupplierUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None

class SupplierOut(SupplierCreate):
    id: int
    current_balance: float
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ================= CATEGORÍAS & PRODUCTOS =================
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(CategoryCreate):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    unit: Optional[str] = "UND"
    purchase_price: float = 0.0
    sale_price: float = 0.0
    min_stock: float = 5.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    unit: Optional[str] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    min_stock: Optional[float] = None
    is_active: Optional[bool] = None

class ProductOut(ProductCreate):
    id: int
    is_active: bool
    created_at: datetime
    category: Optional[CategoryOut] = None
    total_stock: Optional[float] = 0.0
    class Config:
        from_attributes = True

# ================= ALMACENES & INVENTARIO =================
class WarehouseCreate(BaseModel):
    code: str
    name: str
    location: Optional[str] = None

class WarehouseOut(WarehouseCreate):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class InventoryOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    warehouse_id: int
    warehouse_name: Optional[str] = None
    stock: float
    reserved_stock: float
    updated_at: datetime
    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: float
    movement_type: str # ENTRADA, SALIDA, AJUSTE
    notes: Optional[str] = None

class StockTransfer(BaseModel):
    product_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: float
    notes: Optional[str] = None

class InventoryMovementOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    warehouse_id: int
    warehouse_name: Optional[str] = None
    movement_type: str
    quantity: float
    previous_stock: float
    new_stock: float
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# ================= VENTAS =================
class SaleDetailCreate(BaseModel):
    product_id: int
    quantity: float
    unit_price: float
    tax: Optional[float] = 0.0

class SaleDetailOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    quantity: float
    unit_price: float
    subtotal: float
    tax: float
    total: float
    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_id: int
    warehouse_id: int
    status: Optional[str] = "FACTURADA" # COTIZACION, PEDIDO, FACTURADA
    notes: Optional[str] = None
    items: List[SaleDetailCreate]

class SaleOut(BaseModel):
    id: int
    sale_number: str
    customer_id: int
    customer_name: Optional[str] = None
    warehouse_id: int
    warehouse_name: Optional[str] = None
    sale_date: datetime
    status: str
    subtotal: float
    tax: float
    total: float
    paid_amount: float
    payment_status: str
    notes: Optional[str] = None
    details: List[SaleDetailOut] = []
    class Config:
        from_attributes = True

# ================= COMPRAS =================
class PurchaseDetailCreate(BaseModel):
    product_id: int
    quantity: float
    unit_price: float
    tax: Optional[float] = 0.0

class PurchaseDetailOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    quantity: float
    unit_price: float
    subtotal: float
    tax: float
    total: float
    class Config:
        from_attributes = True

class PurchaseCreate(BaseModel):
    supplier_id: int
    warehouse_id: int
    status: Optional[str] = "RECIBIDA" # SOLICITUD, ORDEN, RECIBIDA, FACTURADA
    notes: Optional[str] = None
    items: List[PurchaseDetailCreate]

class PurchaseOut(BaseModel):
    id: int
    purchase_number: str
    supplier_id: int
    supplier_name: Optional[str] = None
    warehouse_id: int
    warehouse_name: Optional[str] = None
    purchase_date: datetime
    status: str
    subtotal: float
    tax: float
    total: float
    paid_amount: float
    payment_status: str
    notes: Optional[str] = None
    details: List[PurchaseDetailOut] = []
    class Config:
        from_attributes = True

# ================= PAGOS Y TESORERÍA =================
class PaymentCreate(BaseModel):
    payment_type: str # COBRO_CLIENTE, PAGO_PROVEEDOR
    reference_type: str # VENTA, COMPRA, DIRECTO
    reference_id: Optional[int] = None
    entity_id: int # Cliente o Proveedor
    amount: float
    payment_method: Optional[str] = "TRANSFERENCIA"
    bank_account: Optional[str] = None
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    payment_number: str
    payment_type: str
    reference_type: str
    reference_id: Optional[int] = None
    entity_id: int
    entity_name: Optional[str] = None
    amount: float
    payment_method: str
    bank_account: Optional[str] = None
    transaction_ref: Optional[str] = None
    payment_date: datetime
    notes: Optional[str] = None
    class Config:
        from_attributes = True

# ================= DOCUMENTOS CLOUD =================
class DocumentOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    filename: str
    original_name: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    s3_bucket: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# ================= AUDITORÍA =================
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    module: str
    record_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

# ================= DASHBOARD & ANALÍTICA =================
class DashboardKPIs(BaseModel):
    total_sales: float
    total_purchases: float
    gross_profit: float
    pending_receivables: float # CxC
    pending_payables: float    # CxP
    low_stock_count: int
    total_products: int
    total_customers: int
    recent_sales: List[dict]
    low_stock_products: List[dict]
    sales_by_month: List[dict]
