from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Payment, Customer, Supplier, User
from app.schemas.schemas import PaymentCreate, PaymentOut
from app.services.payment_service import register_payment
from app.services.sale_service import get_peru_time
from app.security.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["Pagos y Tesorería (CxC / CxP)"])

@router.get("/", response_model=List[PaymentOut])
def list_payments(db: Session = Depends(get_db)):
    payments = db.query(Payment).order_by(Payment.payment_date.desc()).all()
    results = []
    for p in payments:
        entity_name = "N/A"
        if p.payment_type == "COBRO_CLIENTE":
            cust = db.query(Customer).filter(Customer.id == p.entity_id).first()
            if cust: entity_name = cust.name
        elif p.payment_type == "PAGO_PROVEEDOR":
            sup = db.query(Supplier).filter(Supplier.id == p.entity_id).first()
            if sup: entity_name = sup.name
            
        results.append({
            "id": p.id,
            "payment_number": p.payment_number,
            "payment_type": p.payment_type,
            "reference_type": p.reference_type,
            "reference_id": p.reference_id,
            "entity_id": p.entity_id,
            "entity_name": entity_name,
            "amount": p.amount,
            "payment_method": p.payment_method,
            "bank_account": p.bank_account,
            "transaction_ref": p.transaction_ref,
            "payment_date": get_peru_time(p.payment_date).isoformat() if p.payment_date else get_peru_time().isoformat(),
            "notes": p.notes
        })
    return results

@router.post("/", response_model=PaymentOut)
def create_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = register_payment(
        db=db,
        payment_in=payment_in,
        user_id=current_user.id,
        username=current_user.username
    )
    
    entity_name = "N/A"
    if payment.payment_type == "COBRO_CLIENTE":
        c = db.query(Customer).filter(Customer.id == payment.entity_id).first()
        if c: entity_name = c.name
    else:
        s = db.query(Supplier).filter(Supplier.id == payment.entity_id).first()
        if s: entity_name = s.name
        
    return {
        "id": payment.id,
        "payment_number": payment.payment_number,
        "payment_type": payment.payment_type,
        "reference_type": payment.reference_type,
        "reference_id": payment.reference_id,
        "entity_id": payment.entity_id,
        "entity_name": entity_name,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "bank_account": payment.bank_account,
        "transaction_ref": payment.transaction_ref,
        "payment_date": get_peru_time(payment.payment_date).isoformat() if payment.payment_date else get_peru_time().isoformat(),
        "notes": payment.notes
    }

@router.get("/accounts-receivable")
def get_accounts_receivable(db: Session = Depends(get_db)):
    """Clientes con saldo pendiente de pago (CxC)"""
    customers = db.query(Customer).filter(Customer.current_balance > 0).order_by(Customer.current_balance.desc()).all()
    return [{
        "customer_id": c.id,
        "customer_name": c.name,
        "document": f"{c.document_type}: {c.document_number}",
        "balance": c.current_balance,
        "credit_limit": c.credit_limit
    } for c in customers]

@router.get("/accounts-payable")
def get_accounts_payable(db: Session = Depends(get_db)):
    """Proveedores con facturas pendientes por pagar (CxP)"""
    suppliers = db.query(Supplier).filter(Supplier.current_balance > 0).order_by(Supplier.current_balance.desc()).all()
    return [{
        "supplier_id": s.id,
        "supplier_name": s.name,
        "document": f"{s.document_type}: {s.document_number}",
        "balance": s.current_balance,
        "credit_limit": s.credit_limit
    } for s in suppliers]
