# Manual de Usuario - ERP EnterpriseCloud
## Semana 07: Implementa Servicios en la Nube (AWS)

---

## 1. Acceso al Sistema

1. Abrir el navegador en `http://localhost:3000`
2. Ingresar usuario `admin` y contraseña `admin123`
3. El sistema redirige automáticamente al **Dashboard Ejecutivo**

---

## 2. Dashboard Ejecutivo

El panel principal muestra en tiempo real:
- **Ventas Facturadas** — Total de ingresos registrados en el sistema
- **Compras Ejecutadas** — Total de adquisiciones a proveedores
- **Cuentas por Cobrar (CxC)** — Saldo pendiente de clientes
- **Alertas de Stock** — Productos por debajo del umbral mínimo
- **Gráfico de Tendencia** — Evolución mensual de ventas vs. compras
- **Tabla de últimas transacciones** — Las 5 ventas más recientes

---

## 3. Módulo Comercial & Ventas

**Para emitir un comprobante:**
1. Clic en **Comercial & Ventas** en el menú lateral
2. Clic en **Nueva Venta / Factura**
3. Seleccionar Cliente, Almacén de despacho y Tipo de comprobante
4. Agregar productos con cantidad y precio unitario
5. El sistema calcula automáticamente subtotal + IGV 18%
6. Clic en **Confirmar y Emitir**

El sistema descuenta automáticamente el stock del almacén seleccionado.

---

## 4. Módulo Compras & Adquisiciones

**Para registrar una compra:**
1. Clic en **Compras & Adquisiciones**
2. Clic en **Nueva Orden de Compra**
3. Seleccionar Proveedor, Almacén destino y Estado de recepción
4. Agregar productos con cantidad y precio de costo
5. Si el estado es **RECIBIDA**, el stock se incrementa automáticamente en el almacén
6. Clic en **Confirmar Adquisición**

---

## 5. Módulo Inventario & Kardex

### Catálogo de Productos
- Ver todos los productos con stock global, precio costo y precio venta
- Los productos con stock ≤ stock mínimo se resaltan en rojo

### Stock por Almacén
- Ver las existencias desglosadas por cada almacén físico o virtual

### Kardex Permanente
- Historial completo de todos los movimientos: entradas, salidas, ajustes, transferencias

### Ajustes & Transferencias
- **Ajuste manual**: Regularizar diferencias de inventario (conteo físico, mermas)
- **Transferencia**: Mover stock entre almacenes con doble asiento automático en Kardex

---

## 6. Módulo Finanzas & Tesorería

### Registrar un Cobro (CxC)
1. Ir a **Finanzas & Tesorería**
2. Pestaña **Cuentas por Cobrar**
3. Clic en **Registrar Cobro** junto al cliente
4. Completar monto, medio de pago y referencia bancaria

### Registrar un Pago a Proveedor (CxP)
1. Pestaña **Cuentas por Pagar**
2. Clic en **Emitir Pago** junto al proveedor
3. Completar el monto y confirmar

---

## 7. Archivos Cloud (Amazon S3)

1. Ir a **Archivos Cloud (S3)**
2. Clic en **Subir Archivo a S3**
3. Seleccionar el módulo al que pertenece el documento y el ID de referencia
4. Seleccionar el archivo (PDF, XML, imagen, Excel)
5. Clic en **Transferir a S3**

Los archivos se almacenan en Amazon S3 (o en `uploads/` en modo local) y pueden descargarse en cualquier momento.

---

## 8. Auditoría & Trazabilidad

El módulo registra automáticamente cada operación sensible:
- **Autenticaciones** exitosas y fallidas
- **Creación, modificación o anulación** de ventas, compras y pagos
- **Ajustes de inventario** y transferencias
- **Subida de documentos** a la nube

Se puede filtrar por módulo específico para investigar incidentes.

---

## 9. Administración & IAM (Solo Administrador)

1. Ir a **Administración & IAM**
2. Ver todos los usuarios del sistema
3. Clic en **Nuevo Usuario** para crear un operador
4. Asignar el rol correspondiente según sus funciones

### Roles Disponibles
| Rol | Acceso |
|-----|--------|
| Administrador | Acceso completo |
| Gerente Comercial | Ventas y clientes |
| Jefe de Compras | Compras y proveedores |
| Encargado de Almacén | Inventario y stock |
| Finanzas y Contabilidad | Pagos y reportes |
