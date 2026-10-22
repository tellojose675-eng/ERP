# Manual de Despliegue en Amazon Web Services (AWS)
## ERP EnterpriseCloud - Semana 07: Computación, S3 y RDS

---

## 1. Requisitos Previos
- Cuenta activa en **Amazon Web Services (AWS)** con permisos de Administrador o PowerUser.
- **AWS CLI** instalado y configurado (`aws configure`).
- Git y Docker instalados en la estación de trabajo.

---

## 2. Opción A: Despliegue Automatizado con CloudFormation

1. Abrir una terminal en la raíz del proyecto.
2. Ejecutar el comando de despliegue indicando la región (ej. `us-east-1`):
```bash
aws cloudformation deploy \
  --template-file 05_AWS/template.yaml \
  --stack-name erp-enterprisecloud-stack \
  --parameter-overrides DBUser=erpadmin DBPassword=TuClaveSegura2026! \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. Una vez completado, obtener los outputs del stack:
```bash
aws cloudformation describe-stacks \
  --stack-name erp-enterprisecloud-stack \
  --query "Stacks[0].Outputs" \
  --output table
```
Se obtendrán:
- `EC2PublicIP`: Dirección IP pública de la instancia de cómputo.
- `RDSEndpoint`: Dirección DNS de la base de datos PostgreSQL administrada.
- `S3BucketName`: Nombre del bucket seguro creado para el ERP.

---

## 3. Opción B: Despliegue Automatizado con Terraform

1. Ingresar a la carpeta de infraestructura:
```bash
cd 05_AWS
terraform init
terraform plan
terraform apply -auto-approve
```

---

## 4. Configuración del Servidor de Aplicación en EC2

1. Conectarse a la instancia EC2 por SSH:
```bash
ssh -i "tu-llave.pem" ec2-user@<EC2_PUBLIC_IP>
```

2. Clonar el repositorio del proyecto:
```bash
git clone https://github.com/tu-usuario/erp-enterprisecloud.git /opt/erp-enterprisecloud
cd /opt/erp-enterprisecloud
```

3. Configurar el archivo `.env` para producción:
```bash
cat <<EOF > 03_BACKEND/.env
DATABASE_URL=postgresql://erpadmin:TuClaveSegura2026!@<RDS_ENDPOINT>:5432/erp_enterprisecloud
SECRET_KEY=$(openssl rand -hex 32)
USE_S3_STORAGE=true
AWS_REGION=us-east-1
AWS_S3_BUCKET=<S3_BUCKET_NAME>
EOF
```

4. Iniciar la suite con Docker Compose:
```bash
docker compose up -d --build
```

5. Verificar el estado de los contenedores:
```bash
docker compose ps
docker compose logs -f
```

---

## 5. Configuración de Dominio y Certificado SSL (HTTPS)
Para publicar el ERP bajo un dominio propio (ej. `erp.tuempresa.com`):
1. Crear un registro **A** o **CNAME** en Amazon Route 53 apuntando a la IP pública de la instancia EC2.
2. Instalar Certbot para emitir un certificado TLS gratuito:
```bash
sudo dnf install -y python3-certbot-nginx
sudo certbot --nginx -d erp.tuempresa.com
```

---

## 6. Monitoreo y Mantenimiento con CloudWatch
1. **Métricas de Instancia:** Configurar alarmas en Amazon CloudWatch para alertar cuando el uso de CPU de la instancia EC2 supere el 80% durante más de 5 minutos.
2. **Backups Automatizados en RDS:** Amazon RDS realiza snapshots automáticos diarios de la base de datos PostgreSQL con una ventana de retención recomendada de 7 a 30 días.
3. **Ciclo de Vida en S3:** Configurar reglas de ciclo de vida (Lifecycle Rules) en el bucket S3 para mover documentos de más de 365 días a clases de almacenamiento económico como **S3 Standard-IA** o **Amazon S3 Glacier**.
