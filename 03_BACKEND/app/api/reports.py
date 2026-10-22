from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Sale, Purchase, Product, Inventory, Customer, Supplier

router = APIRouter(prefix="/reports", tags=["Reportes Operativos y Analíticos"])

@router.get("/sales-summary")
def get_sales_summary(db: Session = Depends(get_db)):
    total_sales = db.query(func.count(Sale.id)).scalar() or 0
    total_amount = db.query(func.coalesce(func.sum(Sale.total), 0.0)).scalar() or 0.0
    paid_amount = db.query(func.coalesce(func.sum(Sale.paid_amount), 0.0)).scalar() or 0.0
    pending_amount = total_amount - paid_amount
    
    return {
        "total_transactions": total_sales,
        "total_revenue": round(float(total_amount), 2),
        "total_collected": round(float(paid_amount), 2),
        "total_receivable": round(float(pending_amount), 2)
    }

@router.get("/inventory-valuation")
def get_inventory_valuation(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True).all()
    items = []
    total_cost_val = 0.0
    total_sale_val = 0.0
    
    for p in products:
        qty = sum(inv.stock for inv in p.inventories)
        cost_val = round(qty * p.purchase_price, 2)
        sale_val = round(qty * p.sale_price, 2)
        total_cost_val += cost_val
        total_sale_val += sale_val
        
        items.append({
            "code": p.code,
            "name": p.name,
            "quantity": qty,
            "purchase_price": p.purchase_price,
            "sale_price": p.sale_price,
            "total_cost": cost_val,
            "total_sale_value": sale_val,
            "potential_margin": round(sale_val - cost_val, 2)
        })
        
    return {
        "total_items": len(items),
        "total_inventory_cost": round(total_cost_val, 2),
        "total_inventory_sale_value": round(total_sale_val, 2),
        "total_projected_profit": round(total_sale_val - total_cost_val, 2),
        "details": items
    }
