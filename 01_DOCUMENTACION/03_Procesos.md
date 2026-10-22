# ERP EnterpriseCloud - Mapa de Procesos Empresariales Integrados

## 1. Macroproceso Empresarial
El sistema **ERP EnterpriseCloud** integra los procesos de negocio bajo el paradigma de trazabilidad continua, donde cada evento operativo alimenta automáticamente el inventario físico, los libros contables/financieros y la pista de auditoría.

---

## 2. Diagrama de Proceso Comercial (Order-to-Cash)
```mermaid
flowchart TD
    A["Cliente solicita cotización"] --> B["Creación de Cotización en ERP"]
    B --> C{"¿Aprobada por cliente?"}
    C -- No --> D["Cotización vencida o descartada"]
    C -- Sí --> E["Conversión a Nota de Pedido / Factura"]
    E --> F["Validación de existencias en Almacén"]
    F -- Stock insuficiente --> G["Alerta a Compras para reposición"]
    F -- Stock OK --> H["Emisión de Comprobante (VTA-2026-XXXX)"]
    H --> I["Descuento automático de Stock"]
    H --> J["Asiento de Salida en Kardex"]
    H --> K["Apertura de Cuenta por Cobrar (CxC)"]
    K --> L["Cliente abona importe"]
    L --> M["Registro de Recibo de Cobranza (COB-XXXX)"]
    M --> N["Cancelación de Deuda y Actualización de Flujo en Bancos"]
    N --> O["Archivado de Comprobante/Voucher en Amazon S3"]
```

---

## 3. Diagrama de Proceso de Compras (Procure-to-Pay)
```mermaid
flowchart TD
    A1["Detección de Stock Crítico (Alerta Dashboard)"] --> B1["Generación de Solicitud de Compra"]
    B1 --> C1["Cotización con Proveedores Homologados"]
    C1 --> D1["Emisión de Orden de Compra (CMP-2026-XXXX)"]
    D1 --> E1["Llegada de Mercadería a Almacén"]
    E1 --> F1{"Inspección Física y Control de Calidad"}
    F1 -- Observado --> G1["Devolución o Reclamo a Proveedor"]
    F1 -- Conforme --> H1["Recepción de Mercadería (Status: RECIBIDA)"]
    H1 --> I1["Incremento automático de Stock"]
    H1 --> J1["Asiento de Entrada en Kardex Permanente"]
    H1 --> K1["Registro de Obligación en Cuentas por Pagar (CxP)"]
    K1 --> L1["Calendarización y Pago a Proveedor (PAG-XXXX)"]
    L1 --> M1["Subida de Factura Electrónica/XML a Amazon S3"]
```

---

## 4. Proceso de Kardex y Control Físico de Inventario
El control de existencias opera bajo el principio de inventario permanente.

```mermaid
flowchart LR
    Op["Operación"] --> Switch{"Tipo"}
    Switch -- Compra Recibida --> In["Entrada en Kardex: +Q"]
    Switch -- Facturación Venta --> Out["Salida en Kardex: -Q"]
    Switch -- Transferencia --> Trans["Salida Origen (-Q) y Entrada Destino (+Q)"]
    Switch -- Ajuste Manual --> Adj["Ajuste Diferencial por Conteo Físico"]
    In --> Upd["Recalcular Stock Actual y Stock Valorizado"]
    Out --> Upd
    Trans --> Upd
    Adj --> Upd
```

---

## 5. Proceso de Gestión Documental y Respaldo Cloud
1. **Captura:** El usuario arrastra o selecciona el documento digitalizado (Factura, Guía de Remisión, Contrato).
2. **Normalización:** El API valida tamaño, tipo MIME y genera un nombre universal único con prefijo hash.
3. **Persistencia Híbrida Cloud:**
   - **Capa Blob:** El archivo binario viaja directamente al bucket de Amazon S3 asignado con cifrado en reposo.
   - **Capa Relacional:** Amazon RDS PostgreSQL guarda el ID de la transacción, bucket, URL segura, usuario creador y timestamp.
4. **Disponibilidad:** El archivo queda accesible de forma instantánea para auditorías tributarias o consultas de operaciones pasadas.
