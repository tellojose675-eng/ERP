from app.main import startup_seed_database
from app.core.database import SessionLocal
from app.models.models import Product, Category

startup_seed_database()
db = SessionLocal()
print("CATEGORIAS TOTALES:", db.query(Category).count())
print("PRODUCTOS TOTALES:", db.query(Product).count())
db.close()
