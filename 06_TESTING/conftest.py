"""
conftest.py - Fixtures compartidos para los tests del ERP EnterpriseCloud.
Crea una BD SQLite en memoria con datos semilla para cada sesión de tests.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.models import (
    Role, User, Category, Warehouse, Product, Inventory,
    Customer, Supplier
)
from app.security.security import hash_password

# ============================================================
# BD SQLite de test (archivo dedicado, se limpia al iniciar)
# ============================================================
TEST_DB_URL = "sqlite:///./test_erp_session.db"

@pytest.fixture(scope="session")
def test_engine():
    """Motor de BD de prueba: crea tablas, siembra datos y las destruye al final."""
    # Limpiar si existe del run anterior
    if os.path.exists("test_erp_session.db"):
        os.remove("test_erp_session.db")

    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)

    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # --- Roles ---
        roles = [
            Role(id=1, name="Administrador", description="Acceso total"),
            Role(id=2, name="Gerente Comercial"),
            Role(id=3, name="Jefe de Compras"),
            Role(id=4, name="Encargado de Almacén"),
            Role(id=5, name="Finanzas y Contabilidad"),
        ]
        db.add_all(roles)
        db.commit()

        # --- Usuario Admin ---
        admin = User(
            id=1,
            username="admin",
            email="admin@test.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin de Test",
            role_id=1,
            is_active=True
        )
        db.add(admin)
        db.commit()

        # --- Categorías ---
        cats = [
            Category(id=1, name="Servidores y Cómputo"),
            Category(id=2, name="Redes y Comunicaciones"),
            Category(id=3, name="Licenciamiento Cloud"),
            Category(id=4, name="Periféricos"),
        ]
        db.add_all(cats)
        db.commit()

        # --- Almacenes ---
        warehouses = [
            Warehouse(id=1, code="ALM-001", name="Almacén Central Lima", location="Lima"),
            Warehouse(id=2, code="ALM-002", name="Almacén Norte", location="Trujillo"),
            Warehouse(id=3, code="ALM-CLOUD", name="Almacén Virtual AWS", location="AWS us-east-1"),
        ]
        db.add_all(warehouses)
        db.commit()

        # --- Productos ---
        products = [
            Product(id=1, code="PROD-SRV-01", name="Servidor Rack 1U Xeon", category_id=1, unit="UND",
                    purchase_price=1800.0, sale_price=2450.0, min_stock=3.0),
            Product(id=2, code="PROD-SW-24", name="Switch Gigabit 24 Puertos", category_id=2, unit="UND",
                    purchase_price=350.0, sale_price=499.0, min_stock=5.0),
            Product(id=3, code="PROD-LIC-01", name="Licencia Cloud Enterprise", category_id=3, unit="UND",
                    purchase_price=120.0, sale_price=199.0, min_stock=10.0),
        ]
        db.add_all(products)
        db.commit()

        # --- Stock Inicial ---
        stocks = [
            Inventory(product_id=1, warehouse_id=1, stock=15.0),
            Inventory(product_id=2, warehouse_id=1, stock=30.0),
            Inventory(product_id=3, warehouse_id=3, stock=100.0),
        ]
        db.add_all(stocks)
        db.commit()

        # --- Clientes ---
        customers = [
            Customer(id=1, document_type="RUC", document_number="20458932114",
                     name="Corporación Minera del Sur S.A.C.", email="contacto@minerasur.pe",
                     phone="+51 987654321", credit_limit=25000.0, current_balance=3450.0),
            Customer(id=2, document_type="RUC", document_number="20601245891",
                     name="Soluciones TI Globales S.R.L.", email="ventas@stg.pe",
                     credit_limit=15000.0, current_balance=0.0),
        ]
        db.add_all(customers)
        db.commit()

        # --- Proveedores ---
        suppliers = [
            Supplier(id=1, document_type="RUC", document_number="20100458923",
                     name="Tech Data Distribuidora Mayorista S.A.", contact_name="Carlos Meneses",
                     email="ventas@techdata.com.pe", credit_limit=50000.0, current_balance=4500.0),
            Supplier(id=2, document_type="RUC", document_number="20334891255",
                     name="Amazon Web Services Peru S.R.L.", contact_name="AWS Account Exec",
                     email="aws@amazon.com", credit_limit=100000.0, current_balance=1200.0),
        ]
        db.add_all(suppliers)
        db.commit()

    finally:
        db.close()

    yield engine

    # Limpiar después de todos los tests
    try:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
    except Exception:
        pass
    try:
        if os.path.exists("test_erp_session.db"):
            os.remove("test_erp_session.db")
    except PermissionError:
        pass  # Windows: el archivo puede seguir bloqueado, se limpia en el próximo run


@pytest.fixture(scope="session")
def client(test_engine):
    """Cliente HTTP de test con BD de prueba inyectada."""
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
