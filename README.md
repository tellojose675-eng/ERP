# ERP EnterpriseCloud

> **Sistema Integrado de Gestión Empresarial Cloud** — Semana 07: Implementa Servicios en la Nube (Amazon Web Services)  
> Arquitectura: **FastAPI + React + SQLite/PostgreSQL RDS + Amazon S3**

---

## 🏗️ Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────┐
│                    USUARIO / NAVEGADOR                     │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTPS
          ┌────────────▼──────────────┐
          │  Frontend React (Vite)   │ ← Tailwind CSS + Lucide Icons
          │  puerto :3000 (dev)      │
          │  Nginx proxy (producción)│
          └────────────┬─────────────┘
                       │ /api/v1/* (Proxy Reverso)
          ┌────────────▼──────────────┐
          │  Backend FastAPI (Python) │ ← JWT + RBAC + Pydantic v2
          │  puerto :8000             │   SQLAlchemy ORM
          │  Amazon EC2 (prod)        │   Boto3 SDK AWS
          └────┬─────────────┬────────┘
               │             │
   ┌───────────▼──┐   ┌──────▼────────────┐
   │  SQLite /    │   │  Amazon S3         │
   │  PostgreSQL  │   │  (Documentos Cloud)│
   │  Amazon RDS  │   │  SSE-AES256        │
   └──────────────┘   └───────────────────┘
```

---

## 📋 Módulos Implementados

| Módulo | Requerimiento | Funcionalidades |
|--------|--------------|-----------------|
| 🔐 **IAM** | RF-01 | Login JWT, RBAC (5 roles), gestión usuarios |
| 🛒 **Ventas** | RF-02 | Clientes, cotizaciones, facturación, anulación, CxC |
| 📦 **Compras** | RF-03 | Proveedores, órdenes de compra, recepción, CxP |
| 🏭 **Inventario** | RF-04 | Catálogo SKU, multi-almacén, Kardex, ajustes, transferencias |
| 💰 **Finanzas** | RF-05 | Pagos, cobranzas, CxC/CxP, flujo de caja |
| ☁️ **Documentos S3** | RF-06 | Upload/download, S3 + fallback local, metadatos |
| 🔍 **Auditoría** | RF-07 | Log inmutable de operaciones, filtros por módulo |
| 📊 **Dashboard** | RF-08 | KPIs en tiempo real, gráfico de tendencias, alertas stock |

---

## 🚀 Inicio Rápido (Modo Desarrollo Local)

### Prerequisitos
- Python 3.12+ instalado
- Node.js 18+ y npm instalado

### Opción A — Un solo clic (Windows)
```
Doble clic en: start_dev.bat
```
Abre automáticamente `http://localhost:3000` en el navegador.

### Opción B — Manual

**Backend:**
```bash
cd 03_BACKEND
venv\Scripts\activate          # (Windows)
# source venv/bin/activate     # (Linux/macOS)
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd 02_FRONTEND
npm run dev
```

### Credenciales por Defecto
| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `admin123` |

---

## 🧪 Pruebas Automatizadas

```bash
# Opción A — Script Windows
run_tests.bat

# Opción B — Manual
cd 03_BACKEND
.\venv\Scripts\python.exe -m pytest ..\06_TESTING\test_api.py -v
```

**Resultado esperado:** `33 passed` cubriendo los 8 módulos funcionales.

---

## ⚙️ Variables de Entorno

```bash
cp 03_BACKEND/.env.example 03_BACKEND/.env
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a BD | SQLite local |
| `SECRET_KEY` | Clave para firmar JWT | valor interno |
| `USE_S3_STORAGE` | Activar Amazon S3 | `false` |
| `AWS_ACCESS_KEY_ID` | Credencial AWS | vacío |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS | vacío |
| `AWS_REGION` | Región de AWS | `us-east-1` |
| `AWS_S3_BUCKET` | Nombre del bucket | `erp-enterprisecloud-documents` |

---

## 🐳 Docker (Producción)

```bash
# Solo backend + frontend (SQLite)
docker compose up --build

# Stack completo con PostgreSQL local
docker compose --profile full-stack up --build
```

---

## ☁️ Despliegue en AWS (Semana 07)

| Servicio AWS | Uso en el ERP |
|-------------|---------------|
| **Amazon EC2** | Servidor de aplicación (Backend FastAPI + Frontend Nginx) |
| **Amazon RDS PostgreSQL** | Base de datos relacional multi-AZ de alta disponibilidad |
| **Amazon S3** | Repositorio elástico de documentos empresariales (facturas, contratos, PDFs) |
| **Amazon VPC** | Red privada virtual con subnets públicas y privadas |
| **AWS IAM** | Roles y políticas de acceso para EC2 → S3 y RDS |

```bash
# Despliegue con CloudFormation
aws cloudformation deploy \
  --template-file 05_AWS/template.yaml \
  --stack-name erp-enterprisecloud \
  --capabilities CAPABILITY_IAM
```

---

## 📁 Estructura del Proyecto

```
erp zambrano/
├── 01_DOCUMENTACION/        ← SRS y requerimientos del sistema
├── 02_FRONTEND/             ← React + TypeScript + Tailwind CSS + Vite
│   ├── src/
│   │   ├── components/      ← Navbar, Sidebar, Modal (reutilizables)
│   │   ├── layouts/         ← DashboardLayout
│   │   ├── modules/         ← Ventas, Compras, Inventario, Clientes...
│   │   ├── pages/           ← Dashboard, Documentos, Auditoría, Usuarios
│   │   ├── services/        ← Cliente HTTP centralizado (api.ts)
│   │   └── types/           ← Interfaces TypeScript
│   ├── Dockerfile           ← Imagen Nginx multi-stage
│   └── nginx.conf           ← Proxy reverso al backend
├── 03_BACKEND/              ← FastAPI + SQLAlchemy + Pydantic v2
│   ├── app/
│   │   ├── api/             ← Routers REST (auth, ventas, compras...)
│   │   ├── core/            ← Config, DB, Cliente S3
│   │   ├── models/          ← Modelos SQLAlchemy (18 tablas)
│   │   ├── schemas/         ← Schemas Pydantic de entrada/salida
│   │   ├── security/        ← JWT, hashing, dependencias RBAC
│   │   └── services/        ← Lógica de negocio (ventas, compras, inventario...)
│   ├── Dockerfile           ← Imagen Python uvicorn
│   └── requirements.txt     ← Dependencias Python
├── 04_DATABASE/             ← Esquemas SQL (SQLite + PostgreSQL)
├── 05_AWS/                  ← CloudFormation YAML + Terraform + bootstrap EC2
├── 06_TESTING/              ← 33 tests pytest automatizados
├── docker-compose.yml       ← Orquestación completa
├── start_dev.bat            ← Arranque rápido Windows
└── run_tests.bat            ← Ejecución de tests Windows
```

---

## 🔑 Roles del Sistema (RBAC)

| Rol | Acceso |
|-----|--------|
| **Administrador** | Acceso total al sistema, usuarios y auditoría |
| **Gerente Comercial** | Ventas, clientes, documentos, finanzas |
| **Jefe de Compras** | Compras, proveedores, inventario, finanzas |
| **Encargado de Almacén** | Inventario, ajustes, transferencias, documentos |
| **Finanzas y Contabilidad** | Ventas, compras, finanzas, documentos |

---

## 📡 API REST - Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Autenticación JWT |
| `GET` | `/api/v1/dashboard/metrics` | KPIs ejecutivos |
| `GET/POST` | `/api/v1/customers/` | Gestión de clientes |
| `GET/POST` | `/api/v1/suppliers/` | Gestión de proveedores |
| `GET/POST` | `/api/v1/products/` | Catálogo de productos |
| `GET/POST` | `/api/v1/inventory/stock` | Stock por almacén |
| `POST` | `/api/v1/inventory/adjust` | Ajuste de kardex |
| `POST` | `/api/v1/inventory/transfer` | Transferencia entre almacenes |
| `GET/POST` | `/api/v1/sales/` | Ventas y facturación |
| `GET/POST` | `/api/v1/purchases/` | Compras y adquisiciones |
| `GET/POST` | `/api/v1/payments/` | Pagos y tesorería |
| `POST` | `/api/v1/documents/upload` | Subida a Amazon S3 |
| `GET` | `/api/v1/audit/` | Log de auditoría inmutable |
| `GET` | `/api/v1/reports/inventory-valuation` | Valorización de inventario |

> 📚 **Documentación Swagger interactiva:** `http://localhost:8000/docs`
