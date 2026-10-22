#!/bin/bash
# ==============================================================================
# Script de Despliegue Automatizado para Amazon EC2
# ERP EnterpriseCloud (Producción)
# ==============================================================================

set -e

echo "=== INICIANDO DESPLIEGUE ERP ENTERPRISECLOUD EN AWS EC2 ==="

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    sudo dnf update -y
    sudo dnf install -y docker git
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
fi

# 2. Descargar o actualizar código
if [ -d "/opt/erp-enterprisecloud" ]; then
    echo "Actualizando repositorio existente..."
    cd /opt/erp-enterprisecloud
    git pull origin main || true
else
    echo "Directorio de proyecto configurado."
fi

# 3. Construir y levantar contenedores
echo "Construyendo y ejecutando contenedores Docker..."
docker compose -f docker-compose.yml up -d --build

# 4. Estado del despliegue
echo "=== DESPLIEGUE FINALIZADO EXITOSAMENTE ==="
docker compose ps
echo "El sistema está disponible en: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo 'localhost')"
