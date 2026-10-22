from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Product, Category, Inventory, User
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductOut, CategoryCreate, CategoryOut
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/products", tags=["Productos y Catálogo"])

@router.get("/", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.name.asc()).all()
    results = []
    for p in products:
        p_dict = ProductOut.model_validate(p)
        p_dict.total_stock = sum(inv.stock for inv in p.inventories)
        results.append(p_dict)
    return results

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).all()

@router.post("/categories", response_model=CategoryOut)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == category_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="La categoría ya existe")
    cat = Category(name=category_in.name, description=category_in.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.post("/", response_model=ProductOut)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Product).filter(Product.code == product_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese código SKU")
        
    product = Product(
        code=product_in.code,
        name=product_in.name,
        description=product_in.description,
        category_id=product_in.category_id,
        unit=product_in.unit or "UND",
        purchase_price=product_in.purchase_price,
        sale_price=product_in.sale_price,
        min_stock=product_in.min_stock,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    log_activity(
        db=db,
        action="CREAR",
        module="PRODUCTOS",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(product.id),
        details=f"Producto registrado: {product.name} ({product.code})"
    )
    
    p_out = ProductOut.model_validate(product)
    p_out.total_stock = 0.0
    return p_out

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    
    p_out = ProductOut.model_validate(product)
    p_out.total_stock = sum(inv.stock for inv in product.inventories)
    return p_out
