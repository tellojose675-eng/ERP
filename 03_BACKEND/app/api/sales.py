from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Sale, SaleDetail, User, Customer
from app.schemas.schemas import SaleCreate, SaleOut
from app.services.sale_service import create_sale
from app.services.inventory_service import modify_stock
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/sales", tags=["Ventas y Facturación"])

@router.get("/", response_model=List[SaleOut])
def list_sales(db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.sale_date.desc()).all()
    results = []
    for s in sales:
        details_list = []
        for d in s.details:
            details_list.append({
                "id": d.id,
                "product_id": d.product_id,
                "product_name": d.product.name if d.product else "",
                "product_code": d.product.code if d.product else "",
                "quantity": d.quantity,
                "unit_price": d.unit_price,
                "subtotal": d.subtotal,
                "tax": d.tax,
                "total": d.total
            })
        results.append({
            "id": s.id,
            "sale_number": s.sale_number,
            "customer_id": s.customer_id,
            "customer_name": s.customer.name if s.customer else "",
            "warehouse_id": s.warehouse_id,
            "warehouse_name": "Almacén",
            "sale_date": s.sale_date,
            "status": s.status,
            "subtotal": s.subtotal,
            "tax": s.tax,
            "total": s.total,
            "paid_amount": s.paid_amount,
            "payment_status": s.payment_status,
            "notes": s.notes,
            "details": details_list
        })
    return results

@router.post("/", response_model=SaleOut)
def register_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = create_sale(
        db=db,
        sale_in=sale_in,
        user_id=current_user.id,
        username=current_user.username
    )
    
    details_list = []
    for d in sale.details:
        details_list.append({
            "id": d.id,
            "product_id": d.product_id,
            "product_name": d.product.name if d.product else "",
            "product_code": d.product.code if d.product else "",
            "quantity": d.quantity,
            "unit_price": d.unit_price,
            "subtotal": d.subtotal,
            "tax": d.tax,
            "total": d.total
        })
        
    return {
        "id": sale.id,
        "sale_number": sale.sale_number,
        "customer_id": sale.customer_id,
        "customer_name": sale.customer.name if sale.customer else "",
        "warehouse_id": sale.warehouse_id,
        "warehouse_name": "Almacén",
        "sale_date": sale.sale_date,
        "status": sale.status,
        "subtotal": sale.subtotal,
        "tax": sale.tax,
        "total": sale.total,
        "paid_amount": sale.paid_amount,
        "payment_status": sale.payment_status,
        "notes": sale.notes,
        "details": details_list
    }

@router.post("/{sale_id}/cancel")
def cancel_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if sale.status == "ANULADA":
        raise HTTPException(status_code=400, detail="La venta ya está anulada")
        
    # Revertir inventario si estaba facturada o pedido
    if sale.status in ("FACTURADA", "PEDIDO"):
        for item in sale.details:
            modify_stock(
                db=db,
                product_id=item.product_id,
                warehouse_id=sale.warehouse_id,
                quantity=item.quantity,
                movement_type="ENTRADA",
                reference_type="ANULACION_VENTA",
                reference_id=sale.id,
                notes=f"Anulación de comprobante {sale.sale_number}",
                user_id=current_user.id
            )
            
    # Revertir saldo en cliente
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    if customer:
        customer.current_balance = max(0.0, round(customer.current_balance - sale.total, 2))
        
    sale.status = "ANULADA"
    db.commit()
    
    log_activity(
        db=db,
        action="ANULAR",
        module="VENTAS",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(sale.id),
        details=f"Anulación de venta {sale.sale_number}"
    )
    return {"message": f"Venta {sale.sale_number} anulada exitosamente y stock retornado"}
