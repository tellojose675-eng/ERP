# Manual Técnico del Sistema - ERP EnterpriseCloud

## 1. Stack Tecnológico
- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend:** Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, Python-Jose (JWT), Passlib/Bcrypt.
- **SDK Cloud:** Boto3 (Amazon Web Services SDK para Python).
- **Base de Datos:** PostgreSQL 16 (Amazon RDS) con soporte SQLite local.
- **Contenedores:** Docker, Docker Compose, Nginx Alpine.

---

## 2. Organización del Código Fuente

### 2.1 Backend (`03_BACKEND/app/`)
```
app/
├── api/             # Controladores HTTP y endpoints REST agrupados por dominio
│   ├── auth.py      # Login, perfil y generación de tokens JWT
│   ├── customers.py # CRUD de clientes y validaciones
│   ├── suppliers.py # CRUD de proveedores
│   ├── products.py  # Catálogo SKU y categorías
│   ├── inventory.py # Stock por almacén, transferencias y kardex
│   ├── sales.py     # Ventas, cotizaciones y anulación con reposición
│   ├── purchases.py # Compras y recepción de mercadería
│   ├── payments.py  # Finanzas, cobros (CxC) y pagos (CxP)
│   ├── documents.py # Subida/descarga a Amazon S3
│   ├── dashboard.py # KPIs y agregación analítica
│   └── audit.py     # Log inmutable de operaciones
├── core/            # Configuración global, engine de base de datos y cliente S3
│   ├── config.py    # Variables de entorno con Pydantic Settings
│   ├── database.py  # DeclarativeBase y SessionLocal
│   └── s3_client.py # Adaptador híbrido Amazon S3 / Fallback local
├── models/          # Entidades SQLAlchemy (18 tablas)
├── schemas/         # Modelos de validación Pydantic de entrada y salida
├── security/        # Dependencias de autenticación y funciones criptográficas
└── services/        # Lógica de negocio pura (kardex, transacciones, auditoría)
```

### 2.2 Frontend (`02_FRONTEND/src/`)
```
src/
├── components/      # Navbar, Sidebar con indicador AWS, Modales y tarjetas
├── layouts/         # DashboardLayout con control de sesión
├── modules/         # Vistas de negocio (ventas, compras, inventario, finanzas...)
├── pages/           # Dashboard ejecutivo, Documentos S3, Auditoría, Usuarios
├── services/        # Cliente API centralizado (api.ts) con interceptor de token
└── types/           # Definición de interfaces TypeScript
```

---

## 3. Modelo de Datos y Transaccionalidad
- **Transacciones Atómicas:** En operaciones críticas como `create_sale` o `modify_stock`, las inserciones y deducciones de stock se ejecutan dentro del mismo bloque de sesión de base de datos (`db.commit()`), garantizando consistencia ACID absoluta.
- **Auditoría Automática:** Cada mutación exitosa o fallida invoca a `log_activity()`, asegurando que no existan operaciones no registradas.
