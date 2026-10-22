#!/bin/bash
# ==============================================================================
# Script de aprovisionamiento automatizado en Amazon EC2 (User Data)
# ERP EnterpriseCloud - Despliegue en AWS
# ==============================================================================

set -e

echo "[AWS EC2] Actualizando paquetes del sistema..."
dnf update -y

echo "[AWS EC2] Instalando Docker y Docker Compose..."
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user

# Instalar Docker Compose v2 plugin
DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

echo "[AWS EC2] Clonando o descargando ERP EnterpriseCloud..."
mkdir -p /opt/erp-enterprisecloud
cd /opt/erp-enterprisecloud

# Configurar variables de entorno conectando con RDS y S3
cat <<EOF > .env
DATABASE_URL=postgresql://erpadmin:EnterpriseCloud2026!@<RDS_ENDPOINT>:5432/erp_enterprisecloud
USE_S3_STORAGE=true
AWS_REGION=us-east-1
AWS_S3_BUCKET=<S3_BUCKET_NAME>
SECRET_KEY=$(openssl rand -hex 32)
EOF

echo "[AWS EC2] Aprovisionamiento completado exitosamente."
