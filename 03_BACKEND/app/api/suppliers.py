from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Supplier, User
from app.schemas.schemas import SupplierCreate, SupplierUpdate, SupplierOut
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/suppliers", tags=["Proveedores"])

@router.get("/", response_model=List[SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name.asc()).all()

@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return supplier

@router.post("/", response_model=SupplierOut)
def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Supplier).filter(Supplier.document_number == supplier_in.document_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un proveedor con ese número de documento")
        
    supplier = Supplier(
        document_type=supplier_in.document_type,
        document_number=supplier_in.document_number,
        name=supplier_in.name,
        contact_name=supplier_in.contact_name,
        email=supplier_in.email,
        phone=supplier_in.phone,
        address=supplier_in.address,
        credit_limit=supplier_in.credit_limit or 0.0,
        current_balance=0.0,
        is_active=True
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    
    log_activity(
        db=db,
        action="CREAR",
        module="PROVEEDORES",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(supplier.id),
        details=f"Proveedor creado: {supplier.name} ({supplier.document_number})"
    )
    return supplier

@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    for field, value in supplier_in.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
        
    db.commit()
    db.refresh(supplier)
    return supplier
