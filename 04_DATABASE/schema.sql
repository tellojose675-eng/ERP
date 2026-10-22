-- ==============================================================================
-- ERP ENTERPRISECLOUD - ESQUEMA DE BASE DE DATOS MAESTRO
-- Compatible con PostgreSQL (AWS RDS) y SQLite para Desarrollo Local
-- ==============================================================================

-- 1. Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Permisos
CREATE TABLE IF NOT EXISTS permisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    module VARCHAR(50) NOT NULL
);

-- 3. Tabla Intermedia Rol - Permisos
CREATE TABLE IF NOT EXISTS rol_permisos (
    role_id INTEGER NOT NULL,
    permiso_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permiso_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

-- 4. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 5. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type VARCHAR(20) NOT NULL, -- DNI, RUC, NIT, PASAPORTE
    document_number VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30),
    address VARCHAR(255),
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type VARCHAR(20) NOT NULL, -- RUC, NIT, etc.
    document_number VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address VARCHAR(255),
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Categorías de Producto
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT 1
);

-- 8. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE, -- SKU o Código de Barra
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INTEGER,
    unit VARCHAR(20) DEFAULT 'UND', -- UND, KG, MTR, CAJA, LITRO
    purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    min_stock DECIMAL(10, 2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categorias(id)
);

-- 9. Tabla de Almacenes
CREATE TABLE IF NOT EXISTS almacenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT 1
);

-- 10. Tabla de Inventarios (Stock por Almacén)
CREATE TABLE IF NOT EXISTS inventarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    stock DECIMAL(12, 2) DEFAULT 0.00,
    reserved_stock DECIMAL(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES almacenes(id) ON DELETE CASCADE
);

-- 11. Tabla de Movimientos de Inventario (Kardex)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    movement_type VARCHAR(30) NOT NULL, -- ENTRADA, SALIDA, AJUSTE, TRANSFERENCIA
    quantity DECIMAL(12, 2) NOT NULL,
    previous_stock DECIMAL(12, 2) NOT NULL,
    new_stock DECIMAL(12, 2) NOT NULL,
    reference_type VARCHAR(50), -- VENTA, COMPRA, AJUSTE, INICIAL
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES productos(id),
    FOREIGN KEY (warehouse_id) REFERENCES almacenes(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- 12. Tabla de Ventas (Comercial)
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_number VARCHAR(50) NOT NULL UNIQUE, -- ej: VTA-2026-0001
    customer_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'FACTURADA', -- COTIZACION, PEDIDO, FACTURADA, ANULADA
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'PENDIENTE', -- PENDIENTE, PARCIAL, PAGADO
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES clientes(id),
    FOREIGN KEY (warehouse_id) REFERENCES almacenes(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- 13. Tabla de Detalle de Ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES productos(id)
);

-- 14. Tabla de Compras
CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_number VARCHAR(50) NOT NULL UNIQUE, -- ej: CMP-2026-0001
    supplier_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'RECIBIDA', -- SOLICITUD, ORDEN, RECIBIDA, FACTURADA, ANULADA
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'PENDIENTE', -- PENDIENTE, PARCIAL, PAGADO
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES proveedores(id),
    FOREIGN KEY (warehouse_id) REFERENCES almacenes(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- 15. Tabla de Detalle de Compras
CREATE TABLE IF NOT EXISTS detalle_compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES productos(id)
);

-- 16. Tabla de Pagos y Tesorería (CxC / CxP)
CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    payment_type VARCHAR(30) NOT NULL, -- COBRO_CLIENTE (CxC), PAGO_PROVEEDOR (CxP)
    reference_type VARCHAR(30) NOT NULL, -- VENTA, COMPRA, DIRECTO
    reference_id INTEGER,
    entity_id INTEGER NOT NULL, -- ID de Cliente o Proveedor
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'TRANSFERENCIA', -- EFECTIVO, TRANSFERENCIA, TARJETA, CHEQUE
    bank_account VARCHAR(100),
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- 17. Tabla de Documentos Cloud (Amazon S3 / Metadatos)
CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL, -- VENTAS, COMPRAS, CLIENTES, PROVEEDORES, PRODUCTOS
    entity_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(255),
    file_url VARCHAR(500),
    uploaded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES usuarios(id)
);

-- 18. Tabla de Auditoría General
CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- LOGIN, CREAR, ACTUALIZAR, ELIMINAR, DESCARGAR
    module VARCHAR(50) NOT NULL, -- AUTH, VENTAS, COMPRAS, INVENTARIO, FINANZAS, etc.
    record_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'EXITOSO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices Estratégicos de Rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_code ON productos(code);
CREATE INDEX IF NOT EXISTS idx_ventas_customer ON ventas(customer_id);
CREATE INDEX IF NOT EXISTS idx_ventas_date ON ventas(sale_date);
CREATE INDEX IF NOT EXISTS idx_compras_supplier ON compras(supplier_id);
CREATE INDEX IF NOT EXISTS idx_mov_inventario_product ON movimientos_inventario(product_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_module ON auditoria(module);
CREATE INDEX IF NOT EXISTS idx_documentos_entity ON documentos(entity_type, entity_id);
