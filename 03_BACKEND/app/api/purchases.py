from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Purchase, PurchaseDetail, User, Supplier
from app.schemas.schemas import PurchaseCreate, PurchaseOut
from app.services.purchase_service import create_purchase
from app.services.inventory_service import modify_stock
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/purchases", tags=["Compras y Adquisiciones"])

@router.get("/", response_model=List[PurchaseOut])
def list_purchases(db: Session = Depends(get_db)):
    purchases = db.query(Purchase).order_by(Purchase.purchase_date.desc()).all()
    results = []
    for p in purchases:
        details_list = []
        for d in p.details:
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
            "id": p.id,
            "purchase_number": p.purchase_number,
            "supplier_id": p.supplier_id,
            "supplier_name": p.supplier.name if p.supplier else "",
            "warehouse_id": p.warehouse_id,
            "warehouse_name": "Almacén",
            "purchase_date": p.purchase_date,
            "status": p.status,
            "subtotal": p.subtotal,
            "tax": p.tax,
            "total": p.total,
            "paid_amount": p.paid_amount,
            "payment_status": p.payment_status,
            "notes": p.notes,
            "details": details_list
        })
    return results

@router.post("/", response_model=PurchaseOut)
def register_purchase(
    purchase_in: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchase = create_purchase(
        db=db,
        purchase_in=purchase_in,
        user_id=current_user.id,
        username=current_user.username
    )
    
    details_list = []
    for d in purchase.details:
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
        "id": purchase.id,
        "purchase_number": purchase.purchase_number,
        "supplier_id": purchase.supplier_id,
        "supplier_name": purchase.supplier.name if purchase.supplier else "",
        "warehouse_id": purchase.warehouse_id,
        "warehouse_name": "Almacén",
        "purchase_date": purchase.purchase_date,
        "status": purchase.status,
        "subtotal": purchase.subtotal,
        "tax": purchase.tax,
        "total": purchase.total,
        "paid_amount": purchase.paid_amount,
        "payment_status": purchase.payment_status,
        "notes": purchase.notes,
        "details": details_list
    }

@router.post("/{purchase_id}/cancel")
def cancel_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if purchase.status == "ANULADA":
        raise HTTPException(status_code=400, detail="La compra ya está anulada")
        
    if purchase.status in ("RECIBIDA", "FACTURADA"):
        for item in purchase.details:
            modify_stock(
                db=db,
                product_id=item.product_id,
                warehouse_id=purchase.warehouse_id,
                quantity=item.quantity,
                movement_type="SALIDA",
                reference_type="ANULACION_COMPRA",
                reference_id=purchase.id,
                notes=f"Anulación de compra {purchase.purchase_number}",
                user_id=current_user.id
            )
            
    supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id).first()
    if supplier:
        supplier.current_balance = max(0.0, round(supplier.current_balance - purchase.total, 2))
        
    purchase.status = "ANULADA"
    db.commit()
    
    log_activity(
        db=db,
        action="ANULAR",
        module="COMPRAS",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(purchase.id),
        details=f"Anulación de compra {purchase.purchase_number}"
    )
    return {"message": f"Compra {purchase.purchase_number} anulada exitosamente"}
