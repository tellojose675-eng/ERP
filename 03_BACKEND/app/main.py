from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import api_router
from app.models.models import Role, User, Category, Warehouse, Product, Inventory, Customer, Supplier
from app.security.security import hash_password

# Crear todas las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema Integrado de Gestión Empresarial basado en Cloud Computing (AWS Semana 07)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuración de CORS para el Frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_seed_database():
    """Inicializa datos semilla básicos y enriquece el catálogo empresarial."""
    db = SessionLocal()
    try:
        # 1. Roles
        if db.query(Role).count() == 0:
            roles_data = [
                Role(id=1, name="Administrador", description="Acceso total a todos los módulos y configuraciones"),
                Role(id=2, name="Gerente Comercial", description="Gestión de clientes, ventas y cotizaciones"),
                Role(id=3, name="Jefe de Compras", description="Gestión de proveedores y órdenes de compra"),
                Role(id=4, name="Encargado de Almacén", description="Control de inventario, kardex y transferencias"),
                Role(id=5, name="Finanzas y Contabilidad", description="Gestión de cobros, pagos y tesorería")
            ]
            db.add_all(roles_data)
            db.commit()

        # 2. Usuario Administrador por defecto
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@enterprisecloud.com",
                hashed_password=hash_password("admin123"),
                full_name="Administrador del Sistema",
                role_id=1,
                is_active=True
            )
            db.add(admin_user)
            db.commit()

        # 3. Almacenes
        if db.query(Warehouse).count() == 0:
            warehouses = [
                Warehouse(id=1, code="ALM-CENTRAL", name="Almacén Central Lima", location="Av. Javier Prado Este 4500"),
                Warehouse(id=2, code="ALM-NORTE", name="Almacén Regional Norte", location="Parque Industrial Mz B, Trujillo"),
                Warehouse(id=3, code="ALM-CLOUD", name="Almacén Virtual Cloud AWS", location="Amazon AWS us-east-1")
            ]
            db.add_all(warehouses)
            db.commit()

        # 4. Categorías Especializadas de Tecnología
        initial_categories = [
            (1, "Pantallas y Monitores", "Monitores gaming de alta tasa de refresco, pantallas curvas, 4K y monitores portátiles"),
            (2, "Computadoras y Laptops", "Laptops gamer de alta gama, ultrabooks empresariales y computadoras All-in-One"),
            (3, "CPUs y Torres Ensambladas", "Torres ensambladas para gaming y diseño, CPUs corporativos y procesadores Intel/AMD"),
            (4, "Celulares y Smartphones", "Smartphones gama media y alta: Apple iPhone, Samsung Galaxy, Xiaomi y Motorola"),
            (5, "Tablets y iPads", "Tablets para estudio, productividad y diseño: Apple iPad, Samsung Tab y Lenovo"),
            (6, "Partes y Componentes PC", "Tarjetas de video GeForce RTX, memorias RAM DDR5, discos SSD NVMe y fuentes de poder"),
            (7, "Periféricos y Accesorios", "Teclados mecánicos, mouses gamer, audífonos con micrófono y cables adaptadores")
        ]
        for cat_id, cat_name, cat_desc in initial_categories:
            cat = db.query(Category).filter(Category.id == cat_id).first()
            if not cat:
                db.add(Category(id=cat_id, name=cat_name, description=cat_desc, is_active=True))
            else:
                cat.name = cat_name
                cat.description = cat_desc
        db.commit()

        # 5. Catálogo de Tecnología (Computadoras, Pantallas, Celulares, Tablets y CPUs)
        catalog = [
            # Pantallas y Monitores
            ("MON-LG-27GP850", "Monitor Gaming LG UltraGear 27'' QHD 165Hz Nano IPS", "Resolución 2560x1440, 1ms GtG, HDR400, G-Sync Compatible", 1, "UND", 950.0, 1390.0, 4.0, 15.0),
            ("MON-SAM-G5-32", "Monitor Curvo Samsung Odyssey G5 32'' WQHD 144Hz", "Curvatura 1000R inmersiva, 1ms, FreeSync Premium, HDR10", 1, "UND", 1100.0, 1580.0, 3.0, 12.0),
            ("MON-DELL-U2723", "Monitor Profesional Dell UltraSharp 27'' 4K USB-C", "Panel IPS Black, contraste 2000:1, 98% DCI-P3, hub USB-C 90W", 1, "UND", 1850.0, 2490.0, 2.0, 8.0),
            ("MON-ASUS-VG249", "Monitor Gaming ASUS TUF 23.8'' FHD 165Hz IPS", "Full HD 1920x1080, 1ms ELMB, FreeSync Premium, altavoces", 1, "UND", 520.0, 749.0, 5.0, 24.0),
            ("MON-XIA-34CURV", "Monitor Ultrawide Xiaomi Curved Gaming 34'' 144Hz", "Relación 21:9 WQHD 3440x1440, 1500R, 121% sRGB", 1, "UND", 1250.0, 1790.0, 2.0, 10.0),
            ("MON-PORT-ASUS15", "Pantalla Portátil ASUS ZenScreen 15.6'' FHD USB-C", "Monitor ultra delgado IPS antirreflejo con estuche inteligente", 1, "UND", 620.0, 890.0, 3.0, 14.0),

            # Computadoras y Laptops
            ("LAP-ASUS-G16", "Laptop ASUS ROG Strix G16 Core i7 16GB RTX 4060", "Intel Core i7-13650HX, 16GB DDR5, 512GB SSD PCIe 4, 165Hz FHD+", 2, "UND", 3800.0, 4950.0, 2.0, 6.0),
            ("LAP-LEN-T14G4", "Laptop Lenovo ThinkPad E14 Gen 5 Ryzen 7 16GB", "AMD Ryzen 7 7730U, 16GB RAM, 512GB SSD NVMe, Windows 11 Pro", 2, "UND", 2400.0, 3190.0, 3.0, 10.0),
            ("LAP-MAC-M2-13", "Apple MacBook Air 13.6'' Chip M2 8GB 256GB SSD", "Liquid Retina display, cámara FaceTime HD 1080p, Space Gray", 2, "UND", 3600.0, 4699.0, 2.0, 8.0),
            ("LAP-HP-VICT15", "Laptop Gamer HP Victus 15 Core i5 16GB RTX 3050", "Intel Core i5-13420H, 16GB RAM, 512GB SSD, pantalla 144Hz", 2, "UND", 2350.0, 3090.0, 3.0, 9.0),
            ("AIO-HP-24I5", "Computadora All-in-One HP 24'' Intel Core i5 16GB", "Pantalla táctil 23.8 FHD, 16GB RAM, 512GB SSD, teclado y mouse", 2, "UND", 1950.0, 2590.0, 2.0, 7.0),

            # CPUs y Torres Ensambladas
            ("CPU-GAMER-ULT", "Torre Gamer Ultra AMD Ryzen 7 7700X RTX 4070 12GB", "Torre gamer con 32GB RAM DDR5, 1TB NVMe, refrigeración líquida 240mm", 3, "UND", 4900.0, 6450.0, 2.0, 5.0),
            ("CPU-OFIC-I5", "CPU Desktop Corporativo Intel Core i5 13400 16GB", "Torre de oficina 16GB RAM, SSD 512GB NVMe, fuente 500W 80+", 3, "UND", 1450.0, 1990.0, 4.0, 16.0),
            ("CPU-MINI-BEE5", "Mini PC Beelink SER5 AMD Ryzen 5 5560U 16GB RAM", "Mini computador ultra compacto 500GB SSD, WiFi 6, doble HDMI", 3, "UND", 850.0, 1250.0, 3.0, 12.0),
            ("PROC-INTEL-I7", "Procesador CPU Intel Core i7-14700K 20 Núcleos", "Frecuencia turbo 5.6GHz, 33MB Intel Smart Cache, Socket LGA1700", 3, "UND", 1280.0, 1690.0, 4.0, 18.0),
            ("PROC-AMD-R7X3D", "Procesador CPU AMD Ryzen 7 7800X3D 8 Núcleos", "Procesador gaming tope de gama con tecnología 3D V-Cache AM5", 3, "UND", 1350.0, 1790.0, 3.0, 15.0),

            # Celulares y Smartphones
            ("CEL-IPHONE-15P", "Apple iPhone 15 Pro 128GB Titanio Natural 5G", "Chip A17 Pro, triple cámara 48MP con teleobjetivo, pantalla 120Hz", 4, "UND", 3750.0, 4899.0, 2.0, 8.0),
            ("CEL-SAM-S24U", "Samsung Galaxy S24 Ultra 256GB 5G Titanium Black", "Snapdragon 8 Gen 3, S-Pen integrado, cámara 200MP, Galaxy AI", 4, "UND", 3950.0, 5190.0, 2.0, 7.0),
            ("CEL-XIA-NOTE13", "Xiaomi Redmi Note 13 Pro+ 5G 256GB 12GB RAM", "Pantalla AMOLED curva 1.5K 120Hz, cámara 200MP, carga 120W", 4, "UND", 1100.0, 1550.0, 5.0, 20.0),
            ("CEL-MOTO-E50", "Motorola Edge 50 Pro 512GB 12GB RAM Moonlight", "Carga ultra rápida 125W, pantalla pOLED 144Hz, audio Dolby Atmos", 4, "UND", 1750.0, 2390.0, 3.0, 10.0),
            ("CEL-SAM-A55", "Samsung Galaxy A55 5G 128GB 8GB RAM Awesome Navy", "Pantalla Super AMOLED 120Hz, marco metálico, certificación IP67", 4, "UND", 1050.0, 1450.0, 4.0, 18.0),

            # Tablets y iPads
            ("TAB-IPAD-AIR11", "Apple iPad Air 11'' Chip M2 128GB Wi-Fi Space Gray", "Pantalla Liquid Retina, compatible con Apple Pencil Pro y Magic Keyboard", 5, "UND", 2150.0, 2890.0, 2.0, 9.0),
            ("TAB-SAM-S9FE", "Samsung Galaxy Tab S9 FE 10.9'' 128GB Wi-Fi con S-Pen", "Resistencia IP68 al agua y polvo, pantalla 90Hz, batería 8000mAh", 5, "UND", 1250.0, 1750.0, 3.0, 14.0),
            ("TAB-LEN-M11", "Tablet Lenovo Tab M11 128GB 4GB RAM 11'' 90Hz + Lápiz", "Tablet educativa y multimedia con parlantes cuádruples Dolby", 5, "UND", 620.0, 890.0, 4.0, 22.0),
            ("TAB-IPAD-10TH", "Apple iPad 10ma Gen 10.9'' 64GB Wi-Fi Silver", "Chip A14 Bionic, conector USB-C, Touch ID en botón superior", 5, "UND", 1350.0, 1850.0, 3.0, 11.0),

            # Partes y Componentes PC
            ("PART-GPU-RTX4060", "Tarjeta de Video ASUS Dual GeForce RTX 4060 OC 8GB", "Arquitectura Ada Lovelace, DLSS 3, trazado de rayos por hardware", 6, "UND", 1050.0, 1450.0, 3.0, 12.0),
            ("PART-RAM-DDR5-32", "Memoria RAM Kingston FURY Beast DDR5 32GB (2x16GB) 6000MHz", "Kit de doble canal de alta velocidad con soporte Intel XMP 3.0", 6, "UND", 380.0, 540.0, 5.0, 25.0),
            ("PART-SSD-SAM2TB", "Disco Sólido SSD NVMe Samsung 990 PRO 2TB PCIe 4.0 M.2", "Velocidad de lectura hasta 7450 MB/s con disipador térmico", 6, "UND", 580.0, 799.0, 4.0, 16.0),
            ("PART-FUENTE-750W", "Fuente de Poder Corsair RM750e 750W 80 Plus Gold Modular", "Eficiencia Gold, condensadores japoneses 105C, ventilador silencioso", 6, "UND", 340.0, 490.0, 3.0, 14.0),

            # Periféricos y Accesorios
            ("PER-LOGI-GPRO", "Mouse Gamer Inalámbrico Logitech G Pro X Superlight 2", "Sensor HERO 2 de 32,000 DPI, menos de 60 gramos de peso", 7, "UND", 410.0, 590.0, 4.0, 20.0),
            ("PER-RED-KUMARA", "Teclado Mecánico Redragon Kumara K552 RGB Switch Red", "Formato compacto Tenkeyless (TKL) con iluminación RGB personalizable", 7, "UND", 110.0, 169.0, 6.0, 35.0),
            ("PER-AUD-HYPERX", "Audífonos Gamer HyperX Cloud II Wireless Sonido 7.1", "Drivers de 53mm, conectividad inalámbrica 2.4GHz sin latencia", 7, "UND", 310.0, 450.0, 4.0, 15.0)
        ]

        for code, name, desc, cat_id, unit, cost, price, min_stk, initial_qty in catalog:
            p = db.query(Product).filter(Product.code == code).first()
            if not p:
                p = Product(
                    code=code,
                    name=name,
                    description=desc,
                    category_id=cat_id,
                    unit=unit,
                    purchase_price=cost,
                    sale_price=price,
                    min_stock=min_stk,
                    is_active=True
                )
                db.add(p)
                db.flush()
                # Stock en Almacén 1
                db.add(Inventory(product_id=p.id, warehouse_id=1, stock=initial_qty, reserved_stock=0.0))
        db.commit()

        # 6. Clientes iniciales
        if db.query(Customer).count() == 0:
            customers = [
                Customer(id=1, document_type="RUC", document_number="20458932114", name="Corporación Minera del Sur S.A.C.", email="contacto@minerasur.pe", phone="+51 987654321", address="Av. República de Panamá 3565, Lima", credit_limit=25000.0, current_balance=3450.0),
                Customer(id=2, document_type="RUC", document_number="20601245891", name="Soluciones Tecnológicas Globales S.R.L.", email="ventas@stg.pe", phone="+51 998877665", address="Calle Las Begonias 441, Lima", credit_limit=15000.0, current_balance=0.0),
                Customer(id=3, document_type="DNI", document_number="45892147", name="Ing. Roberto Zambrano", email="rzambrano@empresa.com", phone="+51 954123654", address="Jr. Ayacucho 780, Miraflores", credit_limit=5000.0, current_balance=499.0)
            ]
            db.add_all(customers)
            db.commit()

        # 7. Proveedores iniciales
        if db.query(Supplier).count() == 0:
            suppliers = [
                Supplier(id=1, document_type="RUC", document_number="20100458923", name="Tech Data Distribuidora Mayorista S.A.", contact_name="Carlos Meneses", email="ventas@techdata.com.pe", phone="+51 1 6198000", address="Av. Argentina 2850, Lima", credit_limit=50000.0, current_balance=4500.0),
                Supplier(id=2, document_type="RUC", document_number="20334891255", name="Amazon Web Services Services Perú S.R.L.", contact_name="Ejecutivo AWS", email="aws-billing@amazon.com", phone="+1 800 234 567", address="Av. Víctor Andrés Belaunde 147, Lima", credit_limit=100000.0, current_balance=1200.0)
            ]
            db.add_all(suppliers)
            db.commit()

    except Exception as e:
        print(f"[STARTUP SEED ERROR] Error cargando datos iniciales: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "sistema": "ERP EnterpriseCloud",
        "version": settings.VERSION,
        "base_academica": "Semana 07 - Tecnología Cloud con AWS",
        "docs_url": "/docs",
        "status": "OPERACIONAL"
    }
