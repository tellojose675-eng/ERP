from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from app.core.database import Base

# Zona Horaria Oficial del Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))

def get_peru_now():
    """Fecha y hora oficial de Perú (UTC-5)."""
    return datetime.now(PERU_TZ)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=get_peru_now)
    
    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role")

class Permission(Base):
    __tablename__ = "permisos"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    module = Column(String(50), nullable=False)

class RolePermission(Base):
    __tablename__ = "rol_permisos"
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id"), primary_key=True)
    
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission")

class User(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_peru_now)

    role = relationship("Role", back_populates="users")

class Customer(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(20), nullable=False) # DNI, RUC, NIT
    document_number = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(100))
    phone = Column(String(30))
    address = Column(String(255))
    credit_limit = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_peru_now)

    sales = relationship("Sale", back_populates="customer")

class Supplier(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(20), nullable=False)
    document_number = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    contact_name = Column(String(100))
    email = Column(String(100))
    phone = Column(String(30))
    address = Column(String(255))
    credit_limit = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_peru_now)

    purchases = relationship("Purchase", back_populates="supplier")

class Category(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    unit = Column(String(20), default="UND")
    purchase_price = Column(Float, default=0.0)
    sale_price = Column(Float, default=0.0)
    min_stock = Column(Float, default=5.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_peru_now)

    category = relationship("Category", back_populates="products")
    inventories = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    movements = relationship("InventoryMovement", back_populates="product")

class Warehouse(Base):
    __tablename__ = "almacenes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    is_active = Column(Boolean, default=True)

    inventories = relationship("Inventory", back_populates="warehouse")
    movements = relationship("InventoryMovement", back_populates="warehouse")

class Inventory(Base):
    __tablename__ = "inventarios"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    stock = Column(Float, default=0.0)
    reserved_stock = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=get_peru_now, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="inventories")
    warehouse = relationship("Warehouse", back_populates="inventories")

class InventoryMovement(Base):
    __tablename__ = "movimientos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    movement_type = Column(String(30), nullable=False) # ENTRADA, SALIDA, AJUSTE, TRANSFERENCIA
    quantity = Column(Float, nullable=False)
    previous_stock = Column(Float, nullable=False)
    new_stock = Column(Float, nullable=False)
    reference_type = Column(String(50)) # VENTA, COMPRA, AJUSTE, INICIAL
    reference_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=get_peru_now)

    product = relationship("Product", back_populates="movements")
    warehouse = relationship("Warehouse", back_populates="movements")

class Sale(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    sale_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    sale_date = Column(DateTime, default=get_peru_now)
    status = Column(String(30), default="FACTURADA") # COTIZACION, PEDIDO, FACTURADA, ANULADA
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    payment_status = Column(String(30), default="PENDIENTE") # PENDIENTE, PARCIAL, PAGADO
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=get_peru_now)

    customer = relationship("Customer", back_populates="sales")
    warehouse = relationship("Warehouse")
    details = relationship("SaleDetail", back_populates="sale", cascade="all, delete-orphan")

class SaleDetail(Base):
    __tablename__ = "detalle_ventas"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="details")
    product = relationship("Product")

class Purchase(Base):
    __tablename__ = "compras"
    id = Column(Integer, primary_key=True, index=True)
    purchase_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    purchase_date = Column(DateTime, default=get_peru_now)
    status = Column(String(30), default="RECIBIDA") # SOLICITUD, ORDEN, RECIBIDA, FACTURADA, ANULADA
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    payment_status = Column(String(30), default="PENDIENTE") # PENDIENTE, PARCIAL, PAGADO
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=get_peru_now)

    supplier = relationship("Supplier", back_populates="purchases")
    warehouse = relationship("Warehouse")
    details = relationship("PurchaseDetail", back_populates="purchase", cascade="all, delete-orphan")

class PurchaseDetail(Base):
    __tablename__ = "detalle_compras"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("compras.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    purchase = relationship("Purchase", back_populates="details")
    product = relationship("Product")

class Payment(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(50), unique=True, nullable=False, index=True)
    payment_type = Column(String(30), nullable=False) # COBRO_CLIENTE, PAGO_PROVEEDOR
    reference_type = Column(String(30), nullable=False) # VENTA, COMPRA, DIRECTO
    reference_id = Column(Integer, nullable=True)
    entity_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="TRANSFERENCIA") # EFECTIVO, TRANSFERENCIA, TARJETA, CHEQUE
    bank_account = Column(String(100), nullable=True)
    transaction_ref = Column(String(100), nullable=True)
    payment_date = Column(DateTime, default=get_peru_now)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=get_peru_now)

class Document(Base):
    __tablename__ = "documentos"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False) # VENTAS, COMPRAS, CLIENTES, PROVEEDORES, PRODUCTOS
    entity_id = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    s3_bucket = Column(String(100), nullable=True)
    s3_key = Column(String(255), nullable=True)
    file_url = Column(String(500), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=get_peru_now)

class AuditLog(Base):
    __tablename__ = "auditoria"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False) # LOGIN, CREAR, ACTUALIZAR, ELIMINAR, DESCARGAR
    module = Column(String(50), nullable=False) # AUTH, VENTAS, COMPRAS, INVENTARIO, FINANZAS, etc.
    record_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    status = Column(String(20), default="EXITOSO")
    created_at = Column(DateTime, default=get_peru_now)
