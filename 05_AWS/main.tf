terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "erp-enterprisecloud"
}

# 1. S3 Bucket con encriptación SSE y control de acceso
resource "aws_s3_bucket" "documents" {
  bucket_prefix = "${var.project_name}-docs-"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_crypto" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. RDS PostgreSQL Database
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.micro"
  db_name              = "erp_enterprisecloud"
  username             = "erpadmin"
  password             = "EnterpriseCloud2026!"
  skip_final_snapshot  = true
  publicly_accessible = false
}

# 3. EC2 Instance para Backend y Frontend
resource "aws_instance" "app_server" {
  ami           = "ami-0c7217cdde317cfec" # Amazon Linux 2023
  instance_type = "t3.small"

  tags = {
    Name = "${var.project_name}-server"
  }
}

output "s3_bucket_name" {
  value = aws_s3_bucket.documents.id
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
