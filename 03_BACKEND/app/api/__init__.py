from fastapi import APIRouter
from app.api import (
    auth, users, customers, suppliers,
    products, inventory, sales, purchases,
    payments, documents, reports, audit, dashboard
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(customers.router)
api_router.include_router(suppliers.router)
api_router.include_router(products.router)
api_router.include_router(inventory.router)
api_router.include_router(sales.router)
api_router.include_router(purchases.router)
api_router.include_router(payments.router)
api_router.include_router(documents.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(dashboard.router)
