# -*- coding: utf-8 -*-
"""
seed_tech_store.py
Actualiza el catálogo del ERP para orientarlo específicamente al negocio de:
- Pantallas y Monitores (Gaming, Curvos, 4K, Portátiles)
- Computadoras y Laptops (Gamer, Oficina, MacBooks)
- CPUs y Torres Ensambladas (Torres gamer, corporativos, procesadores)
- Celulares y Smartphones (iPhone, Galaxy, Xiaomi, Motorola)
- Tablets y iPads (iPad Air, Galaxy Tab, Lenovo)
- Componentes y Periféricos
"""

from app.core.database import SessionLocal
from app.models.models import Category, Product, Warehouse, Inventory, Customer, Supplier

def run_seed():
    db = SessionLocal()
    try:
        # 1. Asegurar Almacenes
        warehouses = [
            (1, "ALM-TIENDA", "Tienda Principal & Showroom Lima", "Av. Wilson / Garcilaso de la Vega 1348, Tienda 204, Lima"),
            (2, "ALM-CENTRAL", "Almacén Central & Distribución", "Av. Argentina 2150, Lima Industrial"),
            (3, "ALM-SHOWROOM", "Showroom Gaming & Experiencia", "Av. Primavera 120, Surco, Lima")
        ]
        for w_id, w_code, w_name, w_loc in warehouses:
            wh = db.query(Warehouse).filter((Warehouse.id == w_id) | (Warehouse.code == w_code)).first()
            if not wh:
                db.add(Warehouse(id=w_id, code=w_code, name=w_name, location=w_loc, is_active=True))
            else:
                wh.name = w_name
                wh.location = w_loc
        db.commit()

        # 2. Categorías Especializadas de Tecnología
        categories_data = [
            (1, "Pantallas y Monitores", "Monitores gaming de alta frecuencia, pantallas curvas, 4K y monitores portátiles"),
            (2, "Computadoras y Laptops", "Laptops gamer de alta gama, ultrabooks empresariales y computadoras All-in-One"),
            (3, "CPUs y Torres Ensambladas", "Torres ensambladas para gaming y diseño, CPUs corporativos y procesadores Intel/AMD"),
            (4, "Celulares y Smartphones", "Smartphones gama media y alta: Apple iPhone, Samsung Galaxy, Xiaomi y Motorola"),
            (5, "Tablets y iPads", "Tablets para estudio, productividad y diseño: Apple iPad, Samsung Tab y Lenovo"),
            (6, "Partes y Componentes PC", "Tarjetas de video GeForce RTX, memorias RAM DDR5, discos SSD NVMe y fuentes de poder"),
            (7, "Periféricos y Accesorios", "Teclados mecánicos, mouses gamer, audífonos con micrófono y cables adaptadores")
        ]

        for cat_id, cat_name, cat_desc in categories_data:
            cat = db.query(Category).filter(Category.id == cat_id).first()
            if not cat:
                db.add(Category(id=cat_id, name=cat_name, description=cat_desc, is_active=True))
            else:
                cat.name = cat_name
                cat.description = cat_desc
                cat.is_active = True
        db.commit()

        # 3. Limpiar productos e inventarios previos si no tienen ventas registradas
        db.query(Inventory).delete()
        db.query(Product).delete()
        db.commit()

        # 4. Catálogo Completo de Productos de Tecnología
        products_catalog = [
            # Categ 1: Pantallas y Monitores
            ("MON-LG-27GP850", "Monitor Gaming LG UltraGear 27'' QHD 165Hz Nano IPS", "Resolución 2560x1440, 1ms GtG, HDR400, G-Sync Compatible", 1, "UND", 950.0, 1390.0, 4.0, 15.0),
            ("MON-SAM-G5-32", "Monitor Curvo Samsung Odyssey G5 32'' WQHD 144Hz", "Curvatura 1000R inmersiva, 1ms, FreeSync Premium, HDR10", 1, "UND", 1100.0, 1580.0, 3.0, 12.0),
            ("MON-DELL-U2723", "Monitor Profesional Dell UltraSharp 27'' 4K USB-C", "Panel IPS Black, contraste 2000:1, 98% DCI-P3, hub USB-C 90W", 1, "UND", 1850.0, 2490.0, 2.0, 8.0),
            ("MON-ASUS-VG249", "Monitor Gaming ASUS TUF 23.8'' FHD 165Hz IPS", "Full HD 1920x1080, 1ms ELMB, FreeSync Premium, altavoces", 1, "UND", 520.0, 749.0, 5.0, 24.0),
            ("MON-XIA-34CURV", "Monitor Ultrawide Xiaomi Curved Gaming 34'' 144Hz", "Relación 21:9 WQHD 3440x1440, 1500R, 121% sRGB", 1, "UND", 1250.0, 1790.0, 2.0, 10.0),
            ("MON-PORT-ASUS15", "Pantalla Portátil ASUS ZenScreen 15.6'' FHD USB-C", "Monitor ultra delgado IPS antirreflejo con estuche inteligente", 1, "UND", 620.0, 890.0, 3.0, 14.0),

            # Categ 2: Computadoras y Laptops
            ("LAP-ASUS-G16", "Laptop ASUS ROG Strix G16 Core i7 16GB RTX 4060", "Intel Core i7-13650HX, 16GB DDR5, 512GB SSD PCIe 4, 165Hz FHD+", 2, "UND", 3800.0, 4950.0, 2.0, 6.0),
            ("LAP-LEN-T14G4", "Laptop Lenovo ThinkPad E14 Gen 5 Ryzen 7 16GB", "AMD Ryzen 7 7730U, 16GB RAM, 512GB SSD NVMe, Windows 11 Pro", 2, "UND", 2400.0, 3190.0, 3.0, 10.0),
            ("LAP-MAC-M2-13", "Apple MacBook Air 13.6'' Chip M2 8GB 256GB SSD", "Liquid Retina display, cámara FaceTime HD 1080p, Space Gray", 2, "UND", 3600.0, 4699.0, 2.0, 8.0),
            ("LAP-HP-VICT15", "Laptop Gamer HP Victus 15 Core i5 16GB RTX 3050", "Intel Core i5-13420H, 16GB RAM, 512GB SSD, pantalla 144Hz", 2, "UND", 2350.0, 3090.0, 3.0, 9.0),
            ("AIO-HP-24I5", "Computadora All-in-One HP 24'' Intel Core i5 16GB", "Pantalla táctil 23.8 FHD, 16GB RAM, 512GB SSD, teclado y mouse", 2, "UND", 1950.0, 2590.0, 2.0, 7.0),

            # Categ 3: CPUs y Torres Ensambladas
            ("CPU-GAMER-ULT", "Torre Gamer Ultra AMD Ryzen 7 7700X RTX 4070 12GB", "Torre gamer con 32GB RAM DDR5, 1TB NVMe, refrigeración líquida 240mm", 3, "UND", 4900.0, 6450.0, 2.0, 5.0),
            ("CPU-OFIC-I5", "CPU Desktop Corporativo Intel Core i5 13400 16GB", "Torre de oficina 16GB RAM, SSD 512GB NVMe, fuente 500W 80+", 3, "UND", 1450.0, 1990.0, 4.0, 16.0),
            ("CPU-MINI-BEE5", "Mini PC Beelink SER5 AMD Ryzen 5 5560U 16GB RAM", "Mini computador ultra compacto 500GB SSD, WiFi 6, doble HDMI", 3, "UND", 850.0, 1250.0, 3.0, 12.0),
            ("PROC-INTEL-I7", "Procesador CPU Intel Core i7-14700K 20 Núcleos", "Frecuencia turbo 5.6GHz, 33MB Intel Smart Cache, Socket LGA1700", 3, "UND", 1280.0, 1690.0, 4.0, 18.0),
            ("PROC-AMD-R7X3D", "Procesador CPU AMD Ryzen 7 7800X3D 8 Núcleos", "Procesador gaming tope de gama con tecnología 3D V-Cache AM5", 3, "UND", 1350.0, 1790.0, 3.0, 15.0),

            # Categ 4: Celulares y Smartphones
            ("CEL-IPHONE-15P", "Apple iPhone 15 Pro 128GB Titanio Natural 5G", "Chip A17 Pro, triple cámara 48MP con teleobjetivo, pantalla 120Hz", 4, "UND", 3750.0, 4899.0, 2.0, 8.0),
            ("CEL-SAM-S24U", "Samsung Galaxy S24 Ultra 256GB 5G Titanium Black", "Snapdragon 8 Gen 3, S-Pen integrado, cámara 200MP, Galaxy AI", 4, "UND", 3950.0, 5190.0, 2.0, 7.0),
            ("CEL-XIA-NOTE13", "Xiaomi Redmi Note 13 Pro+ 5G 256GB 12GB RAM", "Pantalla AMOLED curva 1.5K 120Hz, cámara 200MP, carga 120W", 4, "UND", 1100.0, 1550.0, 5.0, 20.0),
            ("CEL-MOTO-E50", "Motorola Edge 50 Pro 512GB 12GB RAM Moonlight", "Carga ultra rápida 125W, pantalla pOLED 144Hz, audio Dolby Atmos", 4, "UND", 1750.0, 2390.0, 3.0, 10.0),
            ("CEL-SAM-A55", "Samsung Galaxy A55 5G 128GB 8GB RAM Awesome Navy", "Pantalla Super AMOLED 120Hz, marco metálico, certificación IP67", 4, "UND", 1050.0, 1450.0, 4.0, 18.0),

            # Categ 5: Tablets y iPads
            ("TAB-IPAD-AIR11", "Apple iPad Air 11'' Chip M2 128GB Wi-Fi Space Gray", "Pantalla Liquid Retina, compatible con Apple Pencil Pro y Magic Keyboard", 5, "UND", 2150.0, 2890.0, 2.0, 9.0),
            ("TAB-SAM-S9FE", "Samsung Galaxy Tab S9 FE 10.9'' 128GB Wi-Fi con S-Pen", "Resistencia IP68 al agua y polvo, pantalla 90Hz, batería 8000mAh", 5, "UND", 1250.0, 1750.0, 3.0, 14.0),
            ("TAB-LEN-M11", "Tablet Lenovo Tab M11 128GB 4GB RAM 11'' 90Hz + Lápiz", "Tablet educativa y multimedia con parlantes cuádruples Dolby", 5, "UND", 620.0, 890.0, 4.0, 22.0),
            ("TAB-IPAD-10TH", "Apple iPad 10ma Gen 10.9'' 64GB Wi-Fi Silver", "Chip A14 Bionic, conector USB-C, Touch ID en botón superior", 5, "UND", 1350.0, 1850.0, 3.0, 11.0),

            # Categ 6: Partes y Componentes PC
            ("PART-GPU-RTX4060", "Tarjeta de Video ASUS Dual GeForce RTX 4060 OC 8GB", "Arquitectura Ada Lovelace, DLSS 3, trazado de rayos por hardware", 6, "UND", 1050.0, 1450.0, 3.0, 12.0),
            ("PART-RAM-DDR5-32", "Memoria RAM Kingston FURY Beast DDR5 32GB (2x16GB) 6000MHz", "Kit de doble canal de alta velocidad con soporte Intel XMP 3.0", 6, "UND", 380.0, 540.0, 5.0, 25.0),
            ("PART-SSD-SAM2TB", "Disco Sólido SSD NVMe Samsung 990 PRO 2TB PCIe 4.0 M.2", "Velocidad de lectura hasta 7450 MB/s con disipador térmico", 6, "UND", 580.0, 799.0, 4.0, 16.0),
            ("PART-FUENTE-750W", "Fuente de Poder Corsair RM750e 750W 80 Plus Gold Modular", "Eficiencia Gold, condensadores japoneses 105C, ventilador silencioso", 6, "UND", 340.0, 490.0, 3.0, 14.0),

            # Categ 7: Periféricos y Accesorios
            ("PER-LOGI-GPRO", "Mouse Gamer Inalámbrico Logitech G Pro X Superlight 2", "Sensor HERO 2 de 32,000 DPI, menos de 60 gramos de peso", 7, "UND", 410.0, 590.0, 4.0, 20.0),
            ("PER-RED-KUMARA", "Teclado Mecánico Redragon Kumara K552 RGB Switch Red", "Formato compacto Tenkeyless (TKL) con iluminación RGB personalizable", 7, "UND", 110.0, 169.0, 6.0, 35.0),
            ("PER-AUD-HYPERX", "Audífonos Gamer HyperX Cloud II Wireless Sonido 7.1", "Drivers de 53mm, conectividad inalámbrica 2.4GHz sin latencia", 7, "UND", 310.0, 450.0, 4.0, 15.0)
        ]

        wh_target = db.query(Warehouse).first()
        wh_id = wh_target.id if wh_target else 1

        for prod_tuple in products_catalog:
            code, name, desc, cat_id, unit, cost, price, min_stk, initial_qty = prod_tuple
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

            # Stock inicial en almacén
            inv = Inventory(
                product_id=p.id,
                warehouse_id=wh_id,
                stock=initial_qty,
                reserved_stock=0.0
            )
            db.add(inv)

        db.commit()

        # 5. Proveedores Mayoristas de Tecnología
        suppliers_data = [
            ("RUC", "20100109121", "Grupo Deltron S.A.", "Mayorista líder de cómputo, pantallas y componentes en Perú", "ventas@deltron.com.pe", "+51 1 415-0100", "Av. Manuel Echeandía 261, San Luis, Lima"),
            ("RUC", "20254879201", "Ingram Micro Perú S.A.C.", "Distribuidor oficial Apple, Samsung, Lenovo y ASUS", "contacto@ingrammicro.pe", "+51 1 615-5000", "Av. República de Panamá 3505, Piso 12, San Isidro"),
            ("RUC", "20381928412", "Intcomex del Perú S.A.C.", "Mayorista de smartphones, tablets, pantallas LG y Xiaomi", "pedidos@intcomex.com.pe", "+51 1 712-4000", "Av. Materiales 3045, Callao")
        ]
        for dtype, dnum, sname, contact, semail, sphone, saddr in suppliers_data:
            sup = db.query(Supplier).filter(Supplier.document_number == dnum).first()
            if not sup:
                db.add(Supplier(
                    document_type=dtype,
                    document_number=dnum,
                    name=sname,
                    contact_name=contact,
                    email=semail,
                    phone=sphone,
                    address=saddr,
                    credit_limit=50000.0,
                    current_balance=0.0,
                    is_active=True
                ))
            else:
                sup.name = sname
                sup.contact_name = contact
        db.commit()

        # 6. Clientes del Rubro
        customers_data = [
            ("RUC", "20601245891", "Estudio Digital & Diseño Creativo S.A.C.", "compras@estudiodigital.pe", "+51 987654321", "Av. Larco 812, Miraflores", 20000.0),
            ("RUC", "20458932114", "Gaming Arena Lan Center S.R.L.", "contacto@gamingarena.pe", "+51 998877665", "Av. Arenales 1420, Lince", 15000.0),
            ("DNI", "45892147", "Ing. Roberto Carlos Zambrano", "rzambrano@empresa.com", "+51 954123654", "Jr. Ayacucho 780, Miraflores", 8000.0),
            ("RUC", "20551294819", "Colegio Particular San Agustín de Lima", "administracion@sanagustin.edu.pe", "+51 1 5138000", "Av. Javier Prado Este 980, San Isidro", 35000.0)
        ]
        for dtype, dnum, cname, cemail, cphone, caddr, climit in customers_data:
            cust = db.query(Customer).filter(Customer.document_number == dnum).first()
            if not cust:
                db.add(Customer(
                    document_type=dtype,
                    document_number=dnum,
                    name=cname,
                    email=cemail,
                    phone=cphone,
                    address=caddr,
                    credit_limit=climit,
                    current_balance=0.0,
                    is_active=True
                ))
            else:
                cust.name = cname
        db.commit()

        print("[OK] Catalogo de Tecnologia & Computo sembrado con exito:")
        print(f"  Categorias: {db.query(Category).count()}")
        print(f"  Productos: {db.query(Product).count()}")
        print(f"  Proveedores: {db.query(Supplier).count()}")
        print(f"  Clientes: {db.query(Customer).count()}")

    except Exception as e:
        db.rollback()
        print("Error al sembrar datos:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
