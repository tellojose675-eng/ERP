from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Inventory, InventoryMovement, Product, Warehouse
from typing import Optional

def get_or_create_inventory(db: Session, product_id: int, warehouse_id: int) -> Inventory:
    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.warehouse_id == warehouse_id
    ).first()
    if not inv:
        inv = Inventory(
            product_id=product_id,
            warehouse_id=warehouse_id,
            stock=0.0,
            reserved_stock=0.0
        )
        db.add(inv)
        db.flush()
    return inv

def modify_stock(
    db: Session,
    product_id: int,
    warehouse_id: int,
    quantity: float,
    movement_type: str, # ENTRADA, SALIDA, AJUSTE
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    notes: Optional[str] = None,
    user_id: Optional[int] = None
) -> InventoryMovement:
    """Modifica el stock en un almacén y genera la correspondiente entrada en el Kardex."""
    inv = get_or_create_inventory(db, product_id, warehouse_id)
    prev_stock = inv.stock
    
    if movement_type == "ENTRADA":
        new_stock = prev_stock + quantity
    elif movement_type == "SALIDA":
        if prev_stock < quantity:
            product = db.query(Product).filter(Product.id == product_id).first()
            p_name = product.name if product else f"ID {product_id}"
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{p_name}'. Disponible: {prev_stock}, Solicitado: {quantity}"
            )
        new_stock = prev_stock - quantity
    elif movement_type == "AJUSTE":
        new_stock = quantity
        quantity_diff = new_stock - prev_stock
    else:
        raise HTTPException(status_code=400, detail="Tipo de movimiento no válido")
    
    inv.stock = new_stock
    db.flush()
    
    movement = InventoryMovement(
        product_id=product_id,
        warehouse_id=warehouse_id,
        movement_type=movement_type,
        quantity=quantity,
        previous_stock=prev_stock,
        new_stock=new_stock,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        created_by=user_id
    )
    db.add(movement)
    db.flush()
    return movement

def transfer_stock(
    db: Session,
    product_id: int,
    from_warehouse_id: int,
    to_warehouse_id: int,
    quantity: float,
    notes: Optional[str] = None,
    user_id: Optional[int] = None
):
    """Transfiere inventario entre dos almacenes con trazabilidad en Kardex."""
    if from_warehouse_id == to_warehouse_id:
        raise HTTPException(status_code=400, detail="Los almacenes de origen y destino deben ser diferentes")
    
    # Salida del almacén origen
    modify_stock(
        db=db,
        product_id=product_id,
        warehouse_id=from_warehouse_id,
        quantity=quantity,
        movement_type="SALIDA",
        reference_type="TRANSFERENCIA",
        notes=f"Transferencia hacia almacén ID {to_warehouse_id}: {notes or ''}",
        user_id=user_id
    )
    
    # Entrada en almacén destino
    modify_stock(
        db=db,
        product_id=product_id,
        warehouse_id=to_warehouse_id,
        quantity=quantity,
        movement_type="ENTRADA",
        reference_type="TRANSFERENCIA",
        notes=f"Transferencia desde almacén ID {from_warehouse_id}: {notes or ''}",
        user_id=user_id
    )
    db.commit()
