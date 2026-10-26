import os
import sys
import shutil
from datetime import datetime

# Asegurar path de backend
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.core.database import SessionLocal
from app.models.models import Product, Inventory, Warehouse, InventoryMovement, AuditLog
from app.services.audit_service import log_activity

def update_all_products_stock_to_10():
    db = SessionLocal()
    try:
        products = db.query(Product).order_by(Product.id.asc()).all()
        print(f"Total productos encontrados: {len(products)}")
        
        main_warehouse = db.query(Warehouse).filter(Warehouse.id == 1).first()
        if not main_warehouse:
            main_warehouse = db.query(Warehouse).first()
        wh_id = main_warehouse.id if main_warehouse else 1
        print(f"Almacén principal seleccionado: ID {wh_id} ({main_warehouse.name if main_warehouse else 'Default'})")

        updated_count = 0
        already_10_count = 0

        for p in products:
            inv = db.query(Inventory).filter(
                Inventory.product_id == p.id,
                Inventory.warehouse_id == wh_id
            ).first()

            if not inv:
                inv = Inventory(
                    product_id=p.id,
                    warehouse_id=wh_id,
                    stock=10.0,
                    reserved_stock=0.0
                )
                db.add(inv)
                db.flush()
                # Movimiento kardex
                mov = InventoryMovement(
                    product_id=p.id,
                    warehouse_id=wh_id,
                    movement_type="ENTRADA",
                    quantity=10.0,
                    previous_stock=0.0,
                    new_stock=10.0,
                    reference_type="AJUSTE",
                    notes="Ajuste inicial a 10 unidades para todos los productos",
                    created_by=1
                )
                db.add(mov)
                updated_count += 1
            else:
                if inv.stock != 10.0:
                    prev = inv.stock
                    inv.stock = 10.0
                    inv.reserved_stock = 0.0
                    mov = InventoryMovement(
                        product_id=p.id,
                        warehouse_id=wh_id,
                        movement_type="AJUSTE",
                        quantity=10.0,
                        previous_stock=prev,
                        new_stock=10.0,
                        reference_type="AJUSTE",
                        notes="Ajuste manual a 10 unidades para todos los productos",
                        created_by=1
                    )
                    db.add(mov)
                    updated_count += 1
                else:
                    already_10_count += 1

            # Si el producto tiene stock en otros almacenes, nos aseguramos que estén en 0
            # para que el total_stock sea exactamente 10 unidades
            other_invs = db.query(Inventory).filter(
                Inventory.product_id == p.id,
                Inventory.warehouse_id != wh_id
            ).all()
            for o_inv in other_invs:
                if o_inv.stock != 0.0:
                    o_inv.stock = 0.0
                o_inv.reserved_stock = 0.0

        db.commit()

        # Registrar en auditoría
        log_activity(
            db=db,
            action="AJUSTE_MASIVO",
            module="INVENTARIO",
            user_id=1,
            username="admin",
            record_id="ALL",
            details=f"Ajuste masivo de inventario: Se establecieron 10 unidades a todos los productos ({len(products)} productos)."
        )
        db.commit()

        print(f"Éxito: {updated_count} productos actualizados a 10 unidades ({already_10_count} ya tenían 10).")

    except Exception as e:
        db.rollback()
        print(f"Error actualizando inventario: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    update_all_products_stock_to_10()
