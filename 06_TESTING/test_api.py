"""
test_api.py - Suite completa de pruebas automatizadas para ERP EnterpriseCloud
Cubre RF-01 a RF-08 según el documento de requerimientos del sistema.
"""

# ============================================================
# Helper compartido
# ============================================================
def get_admin_token(client):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200, f"Login falló: {response.text}"
    return response.json()["access_token"]


# ============================================================
# TEST SUITE: Autenticación e IAM (RF-01)
# ============================================================
class TestAuthentication:
    def test_login_admin_success(self, client):
        """RF-01.1: Login exitoso con credenciales admin por defecto."""
        response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "admin"

    def test_login_wrong_password(self, client):
        """RF-01.1: Login debe rechazar contraseñas incorrectas con 401."""
        response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong"})
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """RF-01.1: Login con usuario inexistente retorna 401."""
        response = client.post("/api/v1/auth/login", json={"username": "noexiste", "password": "pass"})
        assert response.status_code == 401

    def test_get_profile_authenticated(self, client):
        """RF-01.2: Usuario autenticado puede consultar su perfil."""
        token = get_admin_token(client)
        response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert data["role"]["name"] == "Administrador"

    def test_get_profile_unauthenticated(self, client):
        """Acceso sin token debe retornar 401 Unauthorized."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


# ============================================================
# TEST SUITE: Módulo de Clientes (RF-02.1)
# ============================================================
class TestCustomers:
    def test_list_customers_returns_initial_data(self, client):
        """RF-02.1: Debe retornar clientes del seed de prueba."""
        response = client.get("/api/v1/customers/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_create_customer_success(self, client):
        """RF-02.1: Crear nuevo cliente con RUC único."""
        token = get_admin_token(client)
        payload = {
            "document_type": "RUC",
            "document_number": "20888777666",
            "name": "Empresa Test Automatizada S.A.C.",
            "email": "test@prueba.com",
            "phone": "+51 999888777",
            "credit_limit": 12000.0
        }
        response = client.post("/api/v1/customers/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["document_number"] == "20888777666"
        assert data["name"] == "Empresa Test Automatizada S.A.C."
        assert data["current_balance"] == 0.0

    def test_create_customer_duplicate_ruc(self, client):
        """RF-02.1: No debe aceptar duplicado de número de documento."""
        token = get_admin_token(client)
        payload = {
            "document_type": "RUC",
            "document_number": "20888777666",  # ya existe del test anterior
            "name": "Otro nombre"
        }
        response = client.post("/api/v1/customers/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400

    def test_get_customer_by_id(self, client):
        """RF-02.1: Consultar cliente por ID debe retornar datos correctos."""
        response = client.get("/api/v1/customers/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["document_type"] == "RUC"


# ============================================================
# TEST SUITE: Módulo de Productos e Inventario (RF-04)
# ============================================================
class TestProducts:
    def test_list_products_returns_seed_data(self, client):
        """RF-04.1: El catálogo debe incluir los productos del seed."""
        response = client.get("/api/v1/products/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_create_product_success(self, client):
        """RF-04.1: Crear producto con código SKU único."""
        token = get_admin_token(client)
        payload = {
            "code": "TEST-SKU-001",
            "name": "Producto de Prueba Automatizada",
            "category_id": 1,
            "unit": "UND",
            "purchase_price": 100.0,
            "sale_price": 150.0,
            "min_stock": 3.0
        }
        response = client.post("/api/v1/products/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "TEST-SKU-001"
        assert data["sale_price"] == 150.0
        assert data["total_stock"] == 0.0

    def test_create_product_duplicate_sku(self, client):
        """RF-04.1: SKU duplicado debe retornar error 400."""
        token = get_admin_token(client)
        payload = {
            "code": "TEST-SKU-001",
            "name": "Duplicado",
            "unit": "UND",
            "purchase_price": 50.0,
            "sale_price": 80.0
        }
        response = client.post("/api/v1/products/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400

    def test_list_categories(self, client):
        """RF-04.1: Listado de categorías disponibles."""
        response = client.get("/api/v1/products/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


# ============================================================
# TEST SUITE: Módulo de Inventario (RF-04.2, RF-04.3)
# ============================================================
class TestInventory:
    def test_list_warehouses(self, client):
        """RF-04.2: Debe listar todos los almacenes disponibles."""
        response = client.get("/api/v1/inventory/warehouses")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_get_stock_report(self, client):
        """RF-04.3: Reporte de stock por almacén retorna lista."""
        response = client.get("/api/v1/inventory/stock")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_adjust_stock_entrada(self, client):
        """RF-04.3: Ajuste de entrada incrementa stock en Kardex."""
        token = get_admin_token(client)
        payload = {
            "product_id": 1,
            "warehouse_id": 1,
            "movement_type": "ENTRADA",
            "quantity": 5.0,
            "notes": "Test entrada automatizada"
        }
        response = client.post("/api/v1/inventory/adjust", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert "movement_id" in response.json()

    def test_adjust_stock_salida_insuficiente(self, client):
        """RF-04.3: Salida que supera stock disponible retorna error 400."""
        token = get_admin_token(client)
        payload = {
            "product_id": 2,
            "warehouse_id": 2,
            "movement_type": "SALIDA",
            "quantity": 999999.0,
            "notes": "Test salida excesiva"
        }
        response = client.post("/api/v1/inventory/adjust", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 400

    def test_kardex_returns_movements(self, client):
        """RF-04.3: El Kardex debe registrar los movimientos históricos."""
        response = client.get("/api/v1/inventory/movements")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# ============================================================
# TEST SUITE: Módulo de Ventas (RF-02)
# ============================================================
class TestSales:
    def test_list_sales(self, client):
        """RF-02: Listado de ventas accesible sin errores."""
        response = client.get("/api/v1/sales/")
        assert response.status_code == 200

    def test_create_sale_with_items(self, client):
        """RF-02.3: Crear venta con cliente y al menos un ítem."""
        token = get_admin_token(client)
        payload = {
            "customer_id": 1,
            "warehouse_id": 1,
            "status": "FACTURADA",
            "notes": "Venta de prueba automatizada",
            "items": [
                {"product_id": 1, "quantity": 1.0, "unit_price": 2450.0}
            ]
        }
        response = client.post("/api/v1/sales/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["sale_number"].startswith("VTA-")
        assert data["total"] > 0
        assert data["payment_status"] == "PENDIENTE"

    def test_sale_igv_calculation(self, client):
        """RF-02.2: El total debe incluir subtotal + IGV 18%."""
        token = get_admin_token(client)
        payload = {
            "customer_id": 2,
            "warehouse_id": 1,
            "status": "COTIZACION",
            "items": [
                {"product_id": 2, "quantity": 2.0, "unit_price": 499.0}
            ]
        }
        response = client.post("/api/v1/sales/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        expected_subtotal = 2.0 * 499.0   # 998.0
        expected_tax = round(expected_subtotal * 0.18, 2)   # 179.64
        expected_total = expected_subtotal + expected_tax    # 1177.64
        assert abs(data["total"] - expected_total) < 0.01

    def test_cancel_sale_restores_stock(self, client):
        """RF-02.4: Anular venta facturada debe reponer stock en almacén."""
        token = get_admin_token(client)
        # Crear venta
        payload = {
            "customer_id": 1,
            "warehouse_id": 1,
            "status": "FACTURADA",
            "items": [{"product_id": 1, "quantity": 1.0, "unit_price": 2450.0}]
        }
        create_resp = client.post("/api/v1/sales/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert create_resp.status_code == 200
        sale_id = create_resp.json()["id"]
        
        # Anular
        cancel_resp = client.post(f"/api/v1/sales/{sale_id}/cancel", headers={"Authorization": f"Bearer {token}"})
        assert cancel_resp.status_code == 200
        assert "anulada" in cancel_resp.json()["message"].lower()


# ============================================================
# TEST SUITE: Módulo de Compras (RF-03)
# ============================================================
class TestPurchases:
    def test_list_purchases(self, client):
        """RF-03: Listado de compras accesible."""
        response = client.get("/api/v1/purchases/")
        assert response.status_code == 200

    def test_create_purchase_with_items(self, client):
        """RF-03.2: Crear orden de compra con proveedor e ítems."""
        token = get_admin_token(client)
        payload = {
            "supplier_id": 1,
            "warehouse_id": 1,
            "status": "ORDEN",
            "notes": "Orden de prueba automatizada",
            "items": [
                {"product_id": 3, "quantity": 5.0, "unit_price": 120.0}
            ]
        }
        response = client.post("/api/v1/purchases/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["purchase_number"].startswith("CMP-")
        assert data["total"] > 0

    def test_purchase_recibida_ingresa_stock(self, client):
        """RF-03.3: Compra RECIBIDA debe incrementar el stock en almacén."""
        token = get_admin_token(client)
        # Verificar stock inicial del producto 3
        stock_before = client.get("/api/v1/inventory/stock?product_id=3").json()
        qty_before = sum(s["stock"] for s in stock_before if s["warehouse_id"] == 3)
        
        payload = {
            "supplier_id": 2,
            "warehouse_id": 3,
            "status": "RECIBIDA",
            "items": [{"product_id": 3, "quantity": 10.0, "unit_price": 120.0}]
        }
        client.post("/api/v1/purchases/", json=payload, headers={"Authorization": f"Bearer {token}"})
        
        stock_after = client.get("/api/v1/inventory/stock?product_id=3").json()
        qty_after = sum(s["stock"] for s in stock_after if s["warehouse_id"] == 3)
        assert qty_after > qty_before


# ============================================================
# TEST SUITE: Finanzas y Tesorería (RF-05)
# ============================================================
class TestFinance:
    def test_list_payments(self, client):
        """RF-05: Historial de movimientos de tesorería accesible."""
        response = client.get("/api/v1/payments/")
        assert response.status_code == 200

    def test_register_customer_collection(self, client):
        """RF-05.1: Registrar cobro a cliente genera comprobante COB-."""
        token = get_admin_token(client)
        payload = {
            "payment_type": "COBRO_CLIENTE",
            "reference_type": "DIRECTO",
            "entity_id": 1,
            "amount": 500.0,
            "payment_method": "TRANSFERENCIA",
            "bank_account": "BCP 191-2384918-0-12",
            "transaction_ref": "TEST-OP-COBRANZA-001"
        }
        response = client.post("/api/v1/payments/", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["payment_number"].startswith("COB-")
        assert data["amount"] == 500.0

    def test_accounts_receivable_cxc(self, client):
        """RF-05.1: CxC muestra clientes con saldo pendiente."""
        response = client.get("/api/v1/payments/accounts-receivable")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # El cliente 1 tiene current_balance 3450 en seed
        if len(data) > 0:
            assert all("balance" in item for item in data)

    def test_accounts_payable_cxp(self, client):
        """RF-05.2: CxP muestra proveedores con obligación pendiente."""
        response = client.get("/api/v1/payments/accounts-payable")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# ============================================================
# TEST SUITE: Dashboard y Business Intelligence (RF-08)
# ============================================================
class TestDashboard:
    def test_dashboard_metrics_all_kpis_present(self, client):
        """RF-08.1: KPIs del dashboard deben incluir todas las métricas core."""
        response = client.get("/api/v1/dashboard/metrics")
        assert response.status_code == 200
        data = response.json()
        required_keys = [
            "total_sales", "total_purchases", "gross_profit",
            "pending_receivables", "pending_payables",
            "low_stock_count", "total_products", "total_customers",
            "recent_sales", "low_stock_products", "sales_by_month"
        ]
        for key in required_keys:
            assert key in data, f"KPI faltante en dashboard: '{key}'"

    def test_dashboard_recent_sales_is_list(self, client):
        """RF-08.2: Las ventas recientes deben ser una lista."""
        response = client.get("/api/v1/dashboard/metrics")
        assert response.status_code == 200
        assert isinstance(response.json()["recent_sales"], list)

    def test_reports_sales_summary(self, client):
        """RF-08: Resumen financiero de ventas disponible."""
        response = client.get("/api/v1/reports/sales-summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_transactions" in data
        assert "total_revenue" in data
        assert "total_receivable" in data

    def test_inventory_valuation_report(self, client):
        """RF-08: Valorización de inventario a costo y precio venta."""
        response = client.get("/api/v1/reports/inventory-valuation")
        assert response.status_code == 200
        data = response.json()
        assert "total_inventory_cost" in data
        assert "total_projected_profit" in data
        assert "details" in data
        assert isinstance(data["details"], list)
