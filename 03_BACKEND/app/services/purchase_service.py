from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Purchase, PurchaseDetail, Supplier, Product
from app.schemas.schemas import PurchaseCreate
from app.services.inventory_service import modify_stock
from app.services.audit_service import log_activity
from datetime import datetime

def generate_purchase_number(db: Session) -> str:
    count = db.query(Purchase).count() + 1
    return f"CMP-{datetime.utcnow().year}-{count:04d}"

def create_purchase(db: Session, purchase_in: PurchaseCreate, user_id: int, username: str) -> Purchase:
    supplier = db.query(Supplier).filter(Supplier.id == purchase_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    purchase_number = generate_purchase_number(db)
    
    subtotal = 0.0
    tax_total = 0.0
    items_to_create = []
    
    for item in purchase_in.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto ID {item.product_id} no encontrado")
        
        line_subtotal = round(item.quantity * item.unit_price, 2)
        line_tax = round(line_subtotal * 0.18, 2)
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
    
    purchase = Purchase(
        purchase_number=purchase_number,
        supplier_id=supplier.id,
        warehouse_id=purchase_in.warehouse_id,
        status=purchase_in.status or "RECIBIDA",
        subtotal=subtotal,
        tax=tax_total,
        total=total,
        paid_amount=0.0,
        payment_status="PENDIENTE",
        notes=purchase_in.notes,
        created_by=user_id
    )
    db.add(purchase)
    db.flush()
    
    for item_data in items_to_create:
        detail = PurchaseDetail(
            purchase_id=purchase.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
            tax=item_data["tax"],
            total=item_data["total"]
        )
        db.add(detail)
        
        # Registrar entrada en inventario si ya fue recibida
        if purchase.status in ("RECIBIDA", "FACTURADA"):
            modify_stock(
                db=db,
                product_id=item_data["product_id"],
                warehouse_id=purchase_in.warehouse_id,
                quantity=item_data["quantity"],
                movement_type="ENTRADA",
                reference_type="COMPRA",
                reference_id=purchase.id,
                notes=f"Ingreso por compra {purchase.purchase_number} de {supplier.name}",
                user_id=user_id
            )
            
    # Registrar obligación en Cuentas por Pagar (CxP) del proveedor
    supplier.current_balance = round(supplier.current_balance + total, 2)
    
    db.commit()
    db.refresh(purchase)
    
    log_activity(
        db=db,
        action="CREAR",
        module="COMPRAS",
        user_id=user_id,
        username=username,
        record_id=str(purchase.id),
        details=f"Registro de orden/factura de compra {purchase.purchase_number} por S/. {purchase.total}"
    )
    
    return purchase
