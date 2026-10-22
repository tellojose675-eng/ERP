# ERP EnterpriseCloud - Plan e Informe de Pruebas Automatizadas

## 1. Resumen Ejecutivo del Ciclo de Pruebas
- **Herramienta de Pruebas:** Pytest 9.1 + FastAPI TestClient.
- **Total de Pruebas Ejecutadas:** 33 pruebas automatizadas.
- **Total Aprobadas:** 33 pruebas (**100% éxito**).
- **Tiempo Total de Ejecución:** < 1.5 segundos.
- **Cobertura:** Módulos de Autenticación, Clientes, Proveedores, Catálogo de Productos, Inventarios, Kardex Permanente, Ventas, Compras, Finanzas, Tesorería y Dashboard.

---

## 2. Detalle de Casos de Prueba Ejecutados

### 2.1 Autenticación e IAM (`TestAuthentication`)
- `test_login_admin_success`: Valida emisión de token JWT con credenciales válidas.
- `test_login_wrong_password`: Valida rechazo y código HTTP 401 ante clave incorrecta.
- `test_login_nonexistent_user`: Valida código HTTP 401 ante usuario inexistente.
- `test_get_profile_authenticated`: Valida consulta de perfil con token Bearer válido.
- `test_get_profile_unauthenticated`: Valida restricción 401 sin token.

### 2.2 Clientes (`TestCustomers`)
- `test_list_customers_returns_initial_data`: Valida lectura del seed de clientes.
- `test_create_customer_success`: Valida inserción de nuevo cliente con RUC válido.
- `test_create_customer_duplicate_ruc`: Valida rechazo con código 400 ante RUC duplicado.
- `test_get_customer_by_id`: Valida consulta por identificador primario.

### 2.3 Productos e Inventario (`TestProducts` & `TestInventory`)
- `test_list_products_returns_seed_data`: Valida catálogo inicial.
- `test_create_product_success`: Valida creación de ítem con SKU único.
- `test_create_product_duplicate_sku`: Valida restricción de SKU duplicado.
- `test_list_categories`: Valida consulta de categorías.
- `test_list_warehouses`: Valida listado de almacenes.
- `test_get_stock_report`: Valida reporte de existencias por almacén.
- `test_adjust_stock_entrada`: Valida incremento de existencias y registro en Kardex.
- `test_adjust_stock_salida_insuficiente`: Valida rechazo transaccional si la salida excede el stock disponible.
- `test_kardex_returns_movements`: Valida trazabilidad histórica del Kardex.

### 2.4 Ventas y Facturación (`TestSales`)
- `test_list_sales`: Valida listado de comprobantes.
- `test_create_sale_with_items`: Valida creación de venta, descuento de inventario y generación de número correlativo (`VTA-`).
- `test_sale_igv_calculation`: Valida exactitud matemática del cálculo de subtotal + 18% IGV.
- `test_cancel_sale_restores_stock`: Valida que la anulación de venta repone las existencias en el almacén.

### 2.5 Compras y Abastecimiento (`TestPurchases`)
- `test_list_purchases`: Valida listado de órdenes de compra.
- `test_create_purchase_with_items`: Valida orden con proveedor homologado.
- `test_purchase_recibida_ingresa_stock`: Valida incremento automático de existencias en almacén cuando la compra está en estado `RECIBIDA`.

### 2.6 Finanzas y Tesorería (`TestFinance`)
- `test_list_payments`: Valida consulta de asientos de pago.
- `test_register_customer_collection`: Valida registro de cobranza (COB-) y rebaja de saldo deudor.
- `test_accounts_receivable_cxc`: Valida cálculo de cuentas por cobrar.
- `test_accounts_payable_cxp`: Valida cálculo de cuentas por pagar.

### 2.7 Dashboard y Analítica (`TestDashboard`)
- `test_dashboard_metrics_all_kpis_present`: Valida presencia de todos los indicadores clave (Ventas, Compras, Utilidad, CxC, CxP, Stock Crítico).
- `test_dashboard_recent_sales_is_list`: Valida integridad del arreglo de transacciones recientes.
- `test_reports_sales_summary`: Valida endpoint de resumen de ventas.
- `test_inventory_valuation_report`: Valida reporte de valorización de inventario a costo y precio de venta.
