import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import Sale, Document
from app.services.sale_service import archive_sale_invoice_to_s3

def sync_all_sales():
    db = SessionLocal()
    try:
        sales = db.query(Sale).all()
        print(f"Total ventas encontradas: {len(sales)}")
        for sale in sales:
            archive_sale_invoice_to_s3(db=db, sale=sale, user_id=sale.created_by or 1)
            print(f"Factura {sale.sale_number} sincronizada en S3 / Documentos.")
            
        total_docs = db.query(Document).filter(Document.entity_type == "VENTAS").count()
        print(f"Total de facturas archivadas en S3: {total_docs}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_all_sales()
