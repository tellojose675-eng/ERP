from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Inventory, Warehouse, InventoryMovement, Product, User
from app.schemas.schemas import (
    WarehouseCreate, WarehouseOut, InventoryOut,
    StockAdjustment, StockTransfer, InventoryMovementOut
)
from app.services.inventory_service import modify_stock, transfer_stock
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/inventory", tags=["Inventario y Almacenes"])

@router.get("/warehouses", response_model=List[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).filter(Warehouse.is_active == True).all()

@router.post("/warehouses", response_model=WarehouseOut)
def create_warehouse(warehouse_in: WarehouseCreate, db: Session = Depends(get_db)):
    existing = db.query(Warehouse).filter(Warehouse.code == warehouse_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="El código de almacén ya existe")
    wh = Warehouse(code=warehouse_in.code, name=warehouse_in.name, location=warehouse_in.location)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@router.get("/stock", response_model=List[InventoryOut])
def list_stock(
    warehouse_id: Optional[int] = Query(None),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if product_id:
        query = query.filter(Inventory.product_id == product_id)
        
    items = query.all()
    results = []
    for item in items:
        results.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else "",
            "product_code": item.product.code if item.product else "",
            "warehouse_id": item.warehouse_id,
            "warehouse_name": item.warehouse.name if item.warehouse else "",
            "stock": item.stock,
            "reserved_stock": item.reserved_stock,
            "updated_at": item.updated_at
        })
    return results

@router.post("/adjust")
def adjust_inventory_stock(
    adjust_in: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    movement = modify_stock(
        db=db,
        product_id=adjust_in.product_id,
        warehouse_id=adjust_in.warehouse_id,
        quantity=adjust_in.quantity,
        movement_type=adjust_in.movement_type,
        reference_type="AJUSTE",
        notes=adjust_in.notes or "Ajuste manual de stock",
        user_id=current_user.id
    )
    db.commit()
    
    log_activity(
        db=db,
        action="AJUSTE",
        module="INVENTARIO",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(movement.id),
        details=f"Ajuste {adjust_in.movement_type} de {adjust_in.quantity} unidades para producto {adjust_in.product_id}"
    )
    return {"message": "Ajuste de inventario aplicado exitosamente", "movement_id": movement.id}

@router.post("/transfer")
def transfer_inventory(
    transfer_in: StockTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfer_stock(
        db=db,
        product_id=transfer_in.product_id,
        from_warehouse_id=transfer_in.from_warehouse_id,
        to_warehouse_id=transfer_in.to_warehouse_id,
        quantity=transfer_in.quantity,
        notes=transfer_in.notes,
        user_id=current_user.id
    )
    
    log_activity(
        db=db,
        action="TRANSFERENCIA",
        module="INVENTARIO",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Transferencia de {transfer_in.quantity} unidades de almacén {transfer_in.from_warehouse_id} a {transfer_in.to_warehouse_id}"
    )
    return {"message": "Transferencia entre almacenes completada exitosamente"}

@router.get("/movements", response_model=List[InventoryMovementOut])
def get_kardex_movements(
    product_id: Optional[int] = Query(None),
    warehouse_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryMovement)
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)
    if warehouse_id:
        query = query.filter(InventoryMovement.warehouse_id == warehouse_id)
        
    movements = query.order_by(InventoryMovement.created_at.desc()).limit(100).all()
    results = []
    for m in movements:
        results.append({
            "id": m.id,
            "product_id": m.product_id,
            "product_name": m.product.name if m.product else "",
            "warehouse_id": m.warehouse_id,
            "warehouse_name": m.warehouse.name if m.warehouse else "",
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "previous_stock": m.previous_stock,
            "new_stock": m.new_stock,
            "reference_type": m.reference_type,
            "reference_id": m.reference_id,
            "notes": m.notes,
            "created_at": m.created_at
        })
    return results
