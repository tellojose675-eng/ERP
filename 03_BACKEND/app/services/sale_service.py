from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Sale, SaleDetail, Customer, Product
from app.schemas.schemas import SaleCreate
from app.services.inventory_service import modify_stock
from app.services.audit_service import log_activity
from datetime import datetime

def generate_sale_number(db: Session) -> str:
    count = db.query(Sale).count() + 1
    return f"VTA-{datetime.utcnow().year}-{count:04d}"

def create_sale(db: Session, sale_in: SaleCreate, user_id: int, username: str) -> Sale:
    customer = db.query(Customer).filter(Customer.id == sale_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    sale_number = generate_sale_number(db)
    
    # Calcular totales
    subtotal = 0.0
    tax_total = 0.0
    items_to_create = []
    
    for item in sale_in.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto ID {item.product_id} no encontrado")
        
        line_subtotal = round(item.quantity * item.unit_price, 2)
        line_tax = round(line_subtotal * 0.18, 2) # IGV / IVA estándar 18%
        line_total = line_subtotal + line_tax
        
        subtotal += line_subtotal
        tax_total += line_tax
        
        items_to_create.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": line_subtotal,
            "tax": line_tax,
            "total": line_total
        })
    
    total = round(subtotal + tax_total, 2)
    
    sale = Sale(
        sale_number=sale_number,
        customer_id=customer.id,
        warehouse_id=sale_in.warehouse_id,
        status=sale_in.status or "FACTURADA",
        subtotal=subtotal,
        tax=tax_total,
        total=total,
        paid_amount=0.0,
        payment_status="PENDIENTE",
        notes=sale_in.notes,
        created_by=user_id
    )
    db.add(sale)
    db.flush()
    
    # Crear los detalles
    for item_data in items_to_create:
        detail = SaleDetail(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
            tax=item_data["tax"],
            total=item_data["total"]
        )
        db.add(detail)
        
        # Descontar inventario si es Facturada o Pedido
        if sale.status in ("FACTURADA", "PEDIDO"):
            modify_stock(
                db=db,
                product_id=item_data["product_id"],
                warehouse_id=sale_in.warehouse_id,
                quantity=item_data["quantity"],
                movement_type="SALIDA",
                reference_type="VENTA",
                reference_id=sale.id,
                notes=f"Venta {sale.sale_number} para {customer.name}",
                user_id=user_id
            )
            
    # Actualizar saldo pendiente en Cuentas por Cobrar (CxC) del cliente
    if sale.status == "FACTURADA":
        customer.current_balance = round(customer.current_balance + total, 2)
        
    db.commit()
    db.refresh(sale)
    
    # Auditoría
    log_activity(
        db=db,
        action="CREAR",
        module="VENTAS",
        user_id=user_id,
        username=username,
        record_id=str(sale.id),
        details=f"Emisión de comprobante {sale.sale_number} por S/. {sale.total}"
    )
    
    return sale
