# ERP EnterpriseCloud - Especificación Técnica de la API REST v1

## 1. Convenciones y Protocolo
- **Protocolo:** HTTP/1.1 y HTTP/2 sobre TLS 1.3.
- **Formato de Carga Útil:** JSON (`application/json`) y `multipart/form-data` para archivos.
- **Formato de Respuesta de Error:**
```json
{
  "detail": "Mensaje descriptivo del error o validación"
}
```
- **Esquema de Autenticación:** Bearer Token estándar (`Authorization: Bearer <JWT>`).

---

## 2. Catálogo de Rutas y Endpoints

### 2.1 Autenticación (`/api/v1/auth`)
- `POST /login`
  - **Payload:** `{"username": "admin", "password": "..."}`
  - **Respuesta 200:** `access_token`, `token_type`, datos de usuario y rol.
- `GET /me`
  - **Headers:** `Authorization: Bearer <token>`
  - **Respuesta 200:** Información del perfil del usuario en sesión.

### 2.2 Clientes (`/api/v1/customers`)
- `GET /` — Lista todos los clientes con límite de crédito y saldo deudor de cuentas por cobrar.
- `GET /{id}` — Detalle de un cliente específico.
- `POST /` — Crea un nuevo cliente con validación de documento único.
- `PUT /{id}` — Actualiza los datos comerciales de un cliente.

### 2.3 Proveedores (`/api/v1/suppliers`)
- `GET /` — Lista de proveedores y obligaciones pendientes (cuentas por pagar).
- `POST /` — Alta de nuevo proveedor homologado.
- `PUT /{id}` — Edición de datos de contacto o dirección.

### 2.4 Productos y Categorías (`/api/v1/products`)
- `GET /` — Retorna catálogo de productos con el stock consolidado calculado en todos los almacenes.
- `POST /` — Crea un producto con código SKU único.
- `PUT /{id}` — Actualización de precios de costo, venta y umbral de alerta.
- `GET /categories` — Listado de categorías.
- `POST /categories` — Creación de nueva categoría.

### 2.5 Inventario y Almacenes (`/api/v1/inventory`)
- `GET /warehouses` — Almacenes registrados (físicos y cloud).
- `POST /warehouses` — Alta de nuevo almacén.
- `GET /stock` — Existencias desglosadas por almacén y producto (`?warehouse_id=...&product_id=...`).
- `POST /adjust` — Ajuste manual de stock (Entrada, Salida o Fijación exacta).
- `POST /transfer` — Transferencia inter-almacenes con doble registro automático en Kardex.
- `GET /movements` — Consulta histórica del Kardex permanente.

### 2.6 Ventas y Facturación (`/api/v1/sales`)
- `GET /` — Lista de comprobantes de venta emitidos.
- `POST /` — Emisión de factura, cotización o pedido. Descuenta stock y abre cuenta por cobrar.
- `POST /{id}/cancel` — Anulación de venta y reversión automática de stock al almacén.

### 2.7 Compras y Abastecimiento (`/api/v1/purchases`)
- `GET /` — Historial de órdenes y facturas de compra.
- `POST /` — Creación de orden de compra. Si el estado es `RECIBIDA`, ingresa existencias al almacén.
- `POST /{id}/cancel` — Anulación de compra y ajuste de stock.

### 2.8 Pagos y Tesorería (`/api/v1/payments`)
- `GET /` — Historial de cobranzas y pagos bancarios.
- `POST /` — Asiento de cobranza a cliente o pago a proveedor.
- `GET /accounts-receivable` — Reporte de saldos vencidos de clientes (CxC).
- `GET /accounts-payable` — Reporte de obligaciones pendientes con proveedores (CxP).

### 2.9 Gestión Documental Cloud (`/api/v1/documents`)
- `POST /upload` — Carga binaria multipart vinculada a una transacción o entidad con destino a Amazon S3.
- `GET /` — Lista de archivos almacenados (`?entity_type=...&entity_id=...`).
- `GET /download/{filename}` — Descarga del archivo físico o redirección autenticada.

### 2.10 Dashboard y Analítica (`/api/v1/dashboard`)
- `GET /metrics` — Agregación en tiempo real de volumen de ventas, compras, utilidad, stock crítico y evolución mensual.

### 2.11 Auditoría (`/api/v1/audit`)
- `GET /` — Consulta de registros inmutables de auditoría (restringido a rol Administrador).
