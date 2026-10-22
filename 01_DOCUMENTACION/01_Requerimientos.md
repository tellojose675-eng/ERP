# ERP EnterpriseCloud - Especificación de Requerimientos del Sistema (SRS)

## 1. Introducción y Propósito
El presente documento describe los requerimientos funcionales y no funcionales para el desarrollo del **ERP EnterpriseCloud**, un sistema integrado de gestión empresarial modular de última generación sustentado en arquitectura Cloud Computing (Amazon Web Services), con frontend React + TypeScript y backend Python + FastAPI.

El objetivo central es eliminar la dispersión de información, optimizar los procesos de compras, ventas, inventarios, finanzas y control documental, garantizando trazabilidad total, seguridad y escalabilidad operativa conforme al programa curricular Semana 07 ("Implementa servicios en la nube").

---

## 2. Requerimientos Funcionales (RF)

### RF-01: Gestión de Identidad y Control de Accesos (IAM)
- **RF-01.1:** El sistema debe autenticar usuarios mediante credenciales seguras (correo/usuario y contraseña encriptada) emitiendo tokens JWT con expiración configurable.
- **RF-01.2:** Implementación de control de acceso basado en roles (RBAC: Administrador, Gerente Comercial, Analista de Compras, Jefe de Almacén, Contador, Auditor).
- **RF-01.3:** Capacidad de activar, suspender o resetear contraseñas de usuarios.

### RF-02: Módulo Comercial y Ventas
- **RF-02.1:** Gestión completa del maestro de clientes con validación de tipo de documento (RUC/DNI/NIT), dirección, contactos y límite crediticio.
- **RF-02.2:** Creación y seguimiento de cotizaciones con cálculo automático de subtotal, impuestos (IVA/IGV) y total.
- **RF-02.3:** Emisión y registro de comprobantes de venta (Factura, Boleta, Nota de Venta).
- **RF-02.4:** Descuento automático de existencias en el inventario al registrar una venta confirmada.
- **RF-02.5:** Control de estado de pago de ventas (Pendiente, Pago Parcial, Cancelado).

### RF-03: Módulo de Compras y Proveedores
- **RF-03.1:** Maestro de proveedores con registro tributario, datos bancarios, personas de contacto y términos de pago.
- **RF-03.2:** Generación y gestión de órdenes de compra con flujo de aprobación.
- **RF-03.3:** Recepción de mercadería con registro automático de entrada en almacén y actualización del costo promedio.
- **RF-03.4:** Registro de facturas de compra y enlace a cuentas por pagar (CxP).

### RF-04: Módulo de Inventarios y Almacenes
- **RF-04.1:** Catálogo de productos con código SKU, categoría, unidad de medida, precios de costo y venta, y umbral de stock mínimo.
- **RF-04.2:** Gestión de múltiples almacenes físicos y lógicos.
- **RF-04.3:** Kardex permanente y valorizado (entradas, salidas, ajustes de inventario y transferencias entre almacenes).
- **RF-04.4:** Generación de alertas proactivas ante niveles críticos de stock.

### RF-05: Módulo de Finanzas y Tesorería
- **RF-05.1:** Control de Cuentas por Cobrar (CxC) con antigüedad de saldos y alertas de vencimiento.
- **RF-05.2:** Control de Cuentas por Pagar (CxP) para calendarización de pagos a proveedores.
- **RF-05.3:** Registro de movimientos de caja chica y conciliación con cuentas bancarias.
- **RF-05.4:** Cálculo en tiempo real de ingresos, egresos y utilidad operativa bruta y neta.

### RF-06: Módulo de Gestión Documental Cloud
- **RF-06.1:** Subida y almacenamiento seguro de archivos asociados a transacciones (facturas PDF/XML, órdenes de compra firmadas, comprobantes de pago, imágenes de productos).
- **RF-06.2:** Integración nativa con Amazon S3 mediante SDK oficial (Boto3) con generación de URLs presignadas o almacenamiento local conmutable para contingencia.
- **RF-06.3:** Asociación estricta de metadatos (tipo de archivo, tamaño, usuario emisor, hash de integridad, entidad vinculada).

### RF-07: Módulo de Auditoría y Trazabilidad
- **RF-07.1:** Registro inmutable de cada transacción sensible (creación, edición, anulación o eliminación).
- **RF-07.2:** Cada log de auditoría debe almacenar: Usuario, Acción, Módulo, Identificador de registro afectado, Timestamp, Dirección IP y Resultado de la operación.

### RF-08: Dashboard y Business Intelligence
- **RF-08.1:** Panel ejecutivo con KPIs en tiempo real: Volumen de ventas del mes, compras ejecutadas, valorización de inventario, índice de rotación, alertas de cuentas por cobrar vencidas y margen de utilidad.
- **RF-08.2:** Gráficas interactivas de tendencia de ventas, top productos más vendidos y balance de flujo de caja.

---

## 3. Requerimientos No Funcionales (RNF)

### RNF-01: Rendimiento y Concurrencia
- **RNF-01.1:** Las respuestas del API REST deben ser inferiores a 300 ms en operaciones estándar bajo carga normal.
- **RNF-01.2:** El backend asíncrono sobre FastAPI debe soportar concurrencia escalable sin bloqueos de I/O.

### RNF-02: Disponibilidad y Arquitectura Cloud
- **RNF-02.1:** Diseñado para alta disponibilidad (99.9%) mediante distribución en AWS (EC2 / ECS / RDS multi-AZ).
- **RNF-02.2:** Almacenamiento elástico e ilimitado de activos en Amazon S3.

### RNF-03: Seguridad de la Información
- **RNF-03.1:** Encriptación de datos en tránsito mediante TLS 1.3 / HTTPS.
- **RNF-03.2:** Encriptación de datos en reposo en Amazon RDS PostgreSQL (KMS) y Amazon S3 (SSE-S3).
- **RNF-03.3:** Hash criptográfico de contraseñas mediante algoritmos robustos con salting.

### RNF-04: Portabilidad y Contenedores
- **RNF-04.1:** Empaquetado completo en contenedores Docker y orquestación reproducible vía Docker Compose para ambientes de desarrollo, pruebas y producción en AWS EC2.

### RNF-05: Usabilidad y Diseño Responsive
- **RNF-05.1:** Interfaz de usuario (UI) responsiva adaptada a escritorios, tablets y dispositivos móviles con React y Tailwind CSS.
- **RNF-05.2:** Notificaciones en tiempo real de operaciones, modales de confirmación para acciones destructivas y navegación intuitiva por pestañas y barras laterales.
