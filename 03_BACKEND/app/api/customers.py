from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Customer, User
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerOut
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/customers", tags=["Clientes"])

@router.get("/", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.name.asc()).all()

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return customer

@router.post("/", response_model=CustomerOut)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Customer).filter(Customer.document_number == customer_in.document_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese número de documento")
        
    customer = Customer(
        document_type=customer_in.document_type,
        document_number=customer_in.document_number,
        name=customer_in.name,
        email=customer_in.email,
        phone=customer_in.phone,
        address=customer_in.address,
        credit_limit=customer_in.credit_limit or 0.0,
        current_balance=0.0,
        is_active=True
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    log_activity(
        db=db,
        action="CREAR",
        module="CLIENTES",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(customer.id),
        details=f"Cliente creado: {customer.name} ({customer.document_number})"
    )
    return customer

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    for field, value in customer_in.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
        
    db.commit()
    db.refresh(customer)
    return customer
