# ERP EnterpriseCloud - Especificación de Infraestructura Cloud con AWS

## 1. Relación con los Contenidos de la Semana 07
El proyecto implementa integralmente los servicios cloud definidos en la Semana 07: **"Implementa servicios en la nube"**, aplicando computación, almacenamiento y bases de datos relacionales administradas.

| Componente Curricular | Servicio AWS Aplicado | Función en el ERP EnterpriseCloud |
|---|---|---|
| **Servicios de Computación** | Amazon EC2 (t3.small / t3.micro) | Aloja el Backend FastAPI y el contenedor Nginx del Frontend |
| **Almacenamiento de Objetos** | Amazon S3 | Repositorio elástico para facturas electrónicas, comprobantes y contratos |
| **Almacenamiento en Bloque** | Amazon EBS (gp3) | Almacenamiento raíz persistente del sistema operativo en la instancia EC2 |
| **Bases de Datos Relacionales** | Amazon RDS PostgreSQL 16 | Motor relacional administrado multi-AZ para datos del ERP |
| **Redes y Conectividad** | Amazon VPC, Subnets, Internet Gateway | Aislamiento perimetral y segmentación pública/privada |
| **Monitoreo y Operaciones** | Amazon CloudWatch | Captura de métricas de CPU, memoria, latencia de API y logs de sistema |

---

## 2. Topología de Red y Arquitectura AWS

```
                            INTERNET
                                │
                                ▼
                       Internet Gateway (IGW)
                                │
   ┌────────────────────────────┼────────────────────────────┐
   │ Amazon VPC: 10.0.0.0/16    │                            │
   │                            ▼                            │
   │   ┌──────────────────────────────────────────────────┐  │
   │   │ Subnet Pública (10.0.1.0/24 - us-east-1a)        │  │
   │   │  ┌────────────────────────────────────────────┐  │  │
   │   │  │ Instancia EC2: ERP-EnterpriseCloud-Server  │  │  │
   │   │  │  ├── Docker: Nginx (Frontend React :80)    │  │  │
   │   │  │  └── Docker: FastAPI (Backend Python :8000)│  │  │
   │   │  └──────────────────────┬─────────────────────┘  │  │
   │   └─────────────────────────┼────────────────────────┘  │
   │                             │                           │
   │                Security Group Port 5432                 │
   │                             │                           │
   │   ┌─────────────────────────▼────────────────────────┐  │
   │   │ Subnets Privadas (10.0.2.0/24 & 10.0.3.0/24)     │  │
   │   │  ┌────────────────────────────────────────────┐  │  │
   │   │  │ Amazon RDS PostgreSQL 16 (Multi-AZ)        │  │  │
   │   │  └────────────────────────────────────────────┘  │  │
   │   └──────────────────────────────────────────────────┘  │
   └─────────────────────────────────────────────────────────┘
                                 │
                    IAM Role + AWS SDK (Boto3)
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │ Amazon S3 Bucket:              │
                 │ erp-enterprisecloud-documents  │
                 │ (SSE-AES256 Encrypted)         │
                 └────────────────────────────────┘
```

---

## 3. Infraestructura como Código (IaC)
El aprovisionamiento se encuentra totalmente automatizado mediante dos opciones disponibles en la carpeta `05_AWS/`:
1. **AWS CloudFormation (`template.yaml`):** Plantilla oficial nativa de AWS con creación de VPC, Subnets, Security Groups, instancia EC2, RDS PostgreSQL y S3 Bucket con encriptación.
2. **HashiCorp Terraform (`main.tf`):** Definición modular y parametrizada con proveedores AWS oficiales.
3. **Script Bootstrap (`ec2_bootstrap.sh`):** Aprovisionamiento `cloud-init` para instalación desatendida de Docker, Git, dependencias y arranque automático del ERP en el primer boot de la máquina virtual EC2.
