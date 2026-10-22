# Guía de Despliegue - ERP EnterpriseCloud

Este directorio contiene las configuraciones e imágenes de despliegue para llevar el ERP EnterpriseCloud a producción:

- `deploy_ec2.sh`: Script bash de instalación y despliegue automático en Amazon EC2.
- `docker-compose.prod.yml`: Orquestación de producción enlazando Backend FastAPI y Frontend Nginx hacia Amazon RDS y Amazon S3.
- `../docker-compose.yml`: Orquestación multi-ambiente (desarrollo local o producción).

## Instrucciones de Ejecución
1. Configurar las variables en `.env` (credenciales RDS y bucket S3).
2. Ejecutar:
```bash
docker compose up -d --build
```
3. Verificar con:
```bash
docker compose ps
```
