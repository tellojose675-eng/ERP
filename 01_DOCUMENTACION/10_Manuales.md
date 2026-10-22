# ERP EnterpriseCloud - Compendio de Manuales del Sistema

El proyecto dispone de un conjunto integral de manuales técnicos y operativos ubicados en la carpeta `08_MANUALES/`:

| Documento | Ubicación | Público Objetivo | Contenido Central |
|---|---|---|---|
| **Manual de Usuario** | `08_MANUALES/Manual_Usuario.md` | Usuarios finales, Vendedores, Almaceneros, Contadores | Guía paso a paso para operar cada módulo, emitir comprobantes, registrar cobros y subir archivos a S3. |
| **Manual Técnico** | `08_MANUALES/Manual_Tecnico.md` | Desarrolladores, Arquitectos de Software, DBAs | Especificación de la arquitectura interna, stack tecnológico, modelos ORM, controladores y patrones. |
| **Manual de Despliegue AWS** | `08_MANUALES/Manual_Despliegue_AWS.md` | Ingenieros Cloud, DevOps, SysAdmins | Procedimiento detallado para aprovisionar EC2, RDS PostgreSQL, S3, Docker y configuración de dominio. |

---

## Acceso Rápido a Comandos de Operación

### 1. Iniciar en Entorno de Desarrollo Local
```cmd
start_dev.bat
```
Levanta FastAPI en `http://localhost:8000` y React en `http://localhost:3000`.

### 2. Ejecutar la Batería de Pruebas
```cmd
run_tests.bat
```
Ejecuta los 33 tests con reporte detallado en consola.

### 3. Despliegue con Contenedores Docker
```bash
docker compose up --build
```
Inicia los servicios en contenedores aislados con proxy Nginx en puerto 80.
