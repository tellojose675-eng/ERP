-- ==============================================================================
-- ERP ENTERPRISECLOUD - ESQUEMA ESPECÍFICO POSTGRESQL (AWS RDS)
-- Diseñado para alta concurrencia, índices B-Tree y escalabilidad cloud
-- ==============================================================================

-- Extensiones recomendadas en RDS PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permisos
CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    module VARCHAR(50) NOT NULL
);

-- 3. Rol - Permisos
CREATE TABLE IF NOT EXISTS rol_permisos (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permiso_id)
);

-- 4. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL,
    document_number VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30),
    address VARCHAR(255),
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL,
    document_number VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address VARCHAR(255),
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. Productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categorias(id),
    unit VARCHAR(20) DEFAULT 'UND',
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(10, 2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Almacenes
CREATE TABLE IF NOT EXISTS almacenes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. Inventarios por Almacén
CREATE TABLE IF NOT EXISTS inventarios (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
    stock NUMERIC(12, 2) DEFAULT 0.00,
    reserved_stock NUMERIC(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_product_warehouse UNIQUE (product_id, warehouse_id)
);

-- 11. Kardex / Movimientos
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES productos(id),
    warehouse_id INTEGER NOT NULL REFERENCES almacenes(id),
    movement_type VARCHAR(30) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES clientes(id),
    warehouse_id INTEGER NOT NULL REFERENCES almacenes(id),
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'FACTURADA',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'PENDIENTE',
    notes TEXT,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Detalle de Ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES productos(id),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL
);

-- 14. Compras
CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES proveedores(id),
    warehouse_id INTEGER NOT NULL REFERENCES almacenes(id),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'RECIBIDA',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'PENDIENTE',
    notes TEXT,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Detalle de Compras
CREATE TABLE IF NOT EXISTS detalle_compras (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES productos(id),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL
);

-- 16. Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    payment_type VARCHAR(30) NOT NULL,
    reference_type VARCHAR(30) NOT NULL,
    reference_id INTEGER,
    entity_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'TRANSFERENCIA',
    bank_account VARCHAR(100),
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Documentos (S3)
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(255),
    file_url VARCHAR(500),
    uploaded_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Auditoría
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'EXITOSO',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
