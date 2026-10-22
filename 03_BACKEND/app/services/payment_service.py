from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Payment, Sale, Purchase, Customer, Supplier
from app.schemas.schemas import PaymentCreate
from app.services.audit_service import log_activity
from datetime import datetime

def generate_payment_number(db: Session, prefix: str = "REC") -> str:
    count = db.query(Payment).count() + 1
    return f"{prefix}-{datetime.utcnow().year}-{count:04d}"

def register_payment(db: Session, payment_in: PaymentCreate, user_id: int, username: str) -> Payment:
    prefix = "COB" if payment_in.payment_type == "COBRO_CLIENTE" else "PAG"
    payment_number = generate_payment_number(db, prefix)
    
    if payment_in.payment_type == "COBRO_CLIENTE":
        customer = db.query(Customer).filter(Customer.id == payment_in.entity_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
            
        # Si tiene referencia a venta específica
        if payment_in.reference_type == "VENTA" and payment_in.reference_id:
            sale = db.query(Sale).filter(Sale.id == payment_in.reference_id).first()
            if sale:
                sale.paid_amount = round(sale.paid_amount + payment_in.amount, 2)
                if sale.paid_amount >= sale.total:
                    sale.payment_status = "PAGADO"
                else:
                    sale.payment_status = "PARCIAL"
                    
        # Reducir saldo deudor del cliente
        customer.current_balance = max(0.0, round(customer.current_balance - payment_in.amount, 2))
        
    elif payment_in.payment_type == "PAGO_PROVEEDOR":
        supplier = db.query(Supplier).filter(Supplier.id == payment_in.entity_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
            
        if payment_in.reference_type == "COMPRA" and payment_in.reference_id:
            purchase = db.query(Purchase).filter(Purchase.id == payment_in.reference_id).first()
            if purchase:
                purchase.paid_amount = round(purchase.paid_amount + payment_in.amount, 2)
                if purchase.paid_amount >= purchase.total:
                    purchase.payment_status = "PAGADO"
                else:
                    purchase.payment_status = "PARCIAL"
                    
        # Reducir obligación con proveedor
        supplier.current_balance = max(0.0, round(supplier.current_balance - payment_in.amount, 2))
    else:
        raise HTTPException(status_code=400, detail="Tipo de pago no soportado")
        
    payment = Payment(
        payment_number=payment_number,
        payment_type=payment_in.payment_type,
        reference_type=payment_in.reference_type,
        reference_id=payment_in.reference_id,
        entity_id=payment_in.entity_id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method or "TRANSFERENCIA",
        bank_account=payment_in.bank_account,
        transaction_ref=payment_in.transaction_ref,
        notes=payment_in.notes,
        created_by=user_id
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    log_activity(
        db=db,
        action="CREAR",
        module="FINANZAS",
        user_id=user_id,
        username=username,
        record_id=str(payment.id),
        details=f"Registro de {payment.payment_type} ({payment.payment_number}) por S/. {payment.amount}"
    )
    
    return payment
