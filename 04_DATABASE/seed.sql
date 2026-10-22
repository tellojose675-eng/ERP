-- ==============================================================================
-- ERP TECHSTORE - DATOS INICIALES (SEED DATA)
-- Negocio de Venta de Tecnología: Computadoras, Pantallas, Celulares, Tablets y CPUs
-- ==============================================================================

-- Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES 
(1, 'Administrador', 'Acceso total y control del sistema'),
(2, 'Gerente Comercial', 'Gestión de clientes, cotizaciones y ventas'),
(3, 'Jefe de Compras', 'Gestión de proveedores y órdenes de compra'),
(4, 'Encargado de Almacén', 'Control de stock, kardex y transferencias'),
(5, 'Finanzas y Contabilidad', 'Gestión de pagos, cobros, caja y bancos');

-- Categorías Especializadas de Tecnología
INSERT OR IGNORE INTO categorias (id, name, description) VALUES
(1, 'Pantallas y Monitores', 'Monitores gaming de alta frecuencia, pantallas curvas, 4K y monitores portátiles'),
(2, 'Computadoras y Laptops', 'Laptops gamer de alta gama, ultrabooks empresariales y computadoras All-in-One'),
(3, 'CPUs y Torres Ensambladas', 'Torres ensambladas para gaming y diseño, CPUs corporativos y procesadores Intel/AMD'),
(4, 'Celulares y Smartphones', 'Smartphones gama media y alta: Apple iPhone, Samsung Galaxy, Xiaomi y Motorola'),
(5, 'Tablets y iPads', 'Tablets para estudio, productividad y diseño: Apple iPad, Samsung Tab y Lenovo'),
(6, 'Partes y Componentes PC', 'Tarjetas de video GeForce RTX, memorias RAM DDR5, discos SSD NVMe y fuentes de poder'),
(7, 'Periféricos y Accesorios', 'Teclados mecánicos, mouses gamer, audífonos con micrófono y cables adaptadores');

-- Almacenes
INSERT OR IGNORE INTO almacenes (id, code, name, location) VALUES
(1, 'ALM-TIENDA', 'Tienda Principal & Showroom Lima', 'Av. Garcilaso de la Vega 1348, Tienda 204, Lima'),
(2, 'ALM-CENTRAL', 'Almacén Central & Distribución', 'Av. Argentina 2150, Lima Industrial'),
(3, 'ALM-SHOWROOM', 'Showroom Gaming & Experiencia', 'Av. Primavera 120, Surco, Lima');

-- Catálogo de Productos
INSERT OR IGNORE INTO productos (id, code, name, description, category_id, unit, purchase_price, sale_price, min_stock) VALUES
(1, 'MON-LG-27GP850', 'Monitor Gaming LG UltraGear 27'' QHD 165Hz Nano IPS', 'Resolución 2560x1440, 1ms GtG, HDR400, G-Sync Compatible', 1, 'UND', 950.00, 1390.00, 4.00),
(2, 'MON-SAM-G5-32', 'Monitor Curvo Samsung Odyssey G5 32'' WQHD 144Hz', 'Curvatura 1000R inmersiva, 1ms, FreeSync Premium, HDR10', 1, 'UND', 1100.00, 1580.00, 3.00),
(3, 'MON-DELL-U2723', 'Monitor Profesional Dell UltraSharp 27'' 4K USB-C', 'Panel IPS Black, contraste 2000:1, 98% DCI-P3, hub USB-C 90W', 1, 'UND', 1850.00, 2490.00, 2.00),
(4, 'MON-ASUS-VG249', 'Monitor Gaming ASUS TUF 23.8'' FHD 165Hz IPS', 'Full HD 1920x1080, 1ms ELMB, FreeSync Premium, altavoces', 1, 'UND', 520.00, 749.00, 5.00),
(5, 'MON-XIA-34CURV', 'Monitor Ultrawide Xiaomi Curved Gaming 34'' 144Hz', 'Relación 21:9 WQHD 3440x1440, 1500R, 121% sRGB', 1, 'UND', 1250.00, 1790.00, 2.00),
(6, 'MON-PORT-ASUS15', 'Pantalla Portátil ASUS ZenScreen 15.6'' FHD USB-C', 'Monitor ultra delgado IPS antirreflejo con estuche inteligente', 1, 'UND', 620.00, 890.00, 3.00),
(7, 'LAP-ASUS-G16', 'Laptop ASUS ROG Strix G16 Core i7 16GB RTX 4060', 'Intel Core i7-13650HX, 16GB DDR5, 512GB SSD PCIe 4, 165Hz FHD+', 2, 'UND', 3800.00, 4950.00, 2.00),
(8, 'LAP-LEN-T14G4', 'Laptop Lenovo ThinkPad E14 Gen 5 Ryzen 7 16GB', 'AMD Ryzen 7 7730U, 16GB RAM, 512GB SSD NVMe, Windows 11 Pro', 2, 'UND', 2400.00, 3190.00, 3.00),
(9, 'LAP-MAC-M2-13', 'Apple MacBook Air 13.6'' Chip M2 8GB 256GB SSD', 'Liquid Retina display, cámara FaceTime HD 1080p, Space Gray', 2, 'UND', 3600.00, 4699.00, 2.00),
(10, 'LAP-HP-VICT15', 'Laptop Gamer HP Victus 15 Core i5 16GB RTX 3050', 'Intel Core i5-13420H, 16GB RAM, 512GB SSD, pantalla 144Hz', 2, 'UND', 2350.00, 3090.00, 3.00),
(11, 'AIO-HP-24I5', 'Computadora All-in-One HP 24'' Intel Core i5 16GB', 'Pantalla táctil 23.8 FHD, 16GB RAM, 512GB SSD, teclado y mouse', 2, 'UND', 1950.00, 2590.00, 2.00),
(12, 'CPU-GAMER-ULT', 'Torre Gamer Ultra AMD Ryzen 7 7700X RTX 4070 12GB', 'Torre gamer con 32GB RAM DDR5, 1TB NVMe, refrigeración líquida 240mm', 3, 'UND', 4900.00, 6450.00, 2.00),
(13, 'CPU-OFIC-I5', 'CPU Desktop Corporativo Intel Core i5 13400 16GB', 'Torre de oficina 16GB RAM, SSD 512GB NVMe, fuente 500W 80+', 3, 'UND', 1450.00, 1990.00, 4.00),
(14, 'CPU-MINI-BEE5', 'Mini PC Beelink SER5 AMD Ryzen 5 5560U 16GB RAM', 'Mini computador ultra compacto 500GB SSD, WiFi 6, doble HDMI', 3, 'UND', 850.00, 1250.00, 3.00),
(15, 'PROC-INTEL-I7', 'Procesador CPU Intel Core i7-14700K 20 Núcleos', 'Frecuencia turbo 5.6GHz, 33MB Intel Smart Cache, Socket LGA1700', 3, 'UND', 1280.00, 1690.00, 4.00),
(16, 'PROC-AMD-R7X3D', 'Procesador CPU AMD Ryzen 7 7800X3D 8 Núcleos', 'Procesador gaming tope de gama con tecnología 3D V-Cache AM5', 3, 'UND', 1350.00, 1790.00, 3.00),
(17, 'CEL-IPHONE-15P', 'Apple iPhone 15 Pro 128GB Titanio Natural 5G', 'Chip A17 Pro, triple cámara 48MP con teleobjetivo, pantalla 120Hz', 4, 'UND', 3750.00, 4899.00, 2.00),
(18, 'CEL-SAM-S24U', 'Samsung Galaxy S24 Ultra 256GB 5G Titanium Black', 'Snapdragon 8 Gen 3, S-Pen integrado, cámara 200MP, Galaxy AI', 4, 'UND', 3950.00, 5190.00, 2.00),
(19, 'CEL-XIA-NOTE13', 'Xiaomi Redmi Note 13 Pro+ 5G 256GB 12GB RAM', 'Pantalla AMOLED curva 1.5K 120Hz, cámara 200MP, carga 120W', 4, 'UND', 1100.00, 1550.00, 5.00),
(20, 'CEL-MOTO-E50', 'Motorola Edge 50 Pro 512GB 12GB RAM Moonlight', 'Carga ultra rápida 125W, pantalla pOLED 144Hz, audio Dolby Atmos', 4, 'UND', 1750.00, 2390.00, 3.00),
(21, 'CEL-SAM-A55', 'Samsung Galaxy A55 5G 128GB 8GB RAM Awesome Navy', 'Pantalla Super AMOLED 120Hz, marco metálico, certificación IP67', 4, 'UND', 1050.00, 1450.00, 4.00),
(22, 'TAB-IPAD-AIR11', 'Apple iPad Air 11'' Chip M2 128GB Wi-Fi Space Gray', 'Pantalla Liquid Retina, compatible con Apple Pencil Pro y Magic Keyboard', 5, 'UND', 2150.00, 2890.00, 2.00),
(23, 'TAB-SAM-S9FE', 'Samsung Galaxy Tab S9 FE 10.9'' 128GB Wi-Fi con S-Pen', 'Resistencia IP68 al agua y polvo, pantalla 90Hz, batería 8000mAh', 5, 'UND', 1250.00, 1750.00, 3.00),
(24, 'TAB-LEN-M11', 'Tablet Lenovo Tab M11 128GB 4GB RAM 11'' 90Hz + Lápiz', 'Tablet educativa y multimedia con parlantes cuádruples Dolby', 5, 'UND', 620.00, 890.00, 4.00),
(25, 'TAB-IPAD-10TH', 'Apple iPad 10ma Gen 10.9'' 64GB Wi-Fi Silver', 'Chip A14 Bionic, conector USB-C, Touch ID en botón superior', 5, 'UND', 1350.00, 1850.00, 3.00),
(26, 'PART-GPU-RTX4060', 'Tarjeta de Video ASUS Dual GeForce RTX 4060 OC 8GB', 'Arquitectura Ada Lovelace, DLSS 3, trazado de rayos por hardware', 6, 'UND', 1050.00, 1450.00, 3.00),
(27, 'PART-RAM-DDR5-32', 'Memoria RAM Kingston FURY Beast DDR5 32GB (2x16GB) 6000MHz', 'Kit de doble canal de alta velocidad con soporte Intel XMP 3.0', 6, 'UND', 380.00, 540.00, 5.00),
(28, 'PART-SSD-SAM2TB', 'Disco Sólido SSD NVMe Samsung 990 PRO 2TB PCIe 4.0 M.2', 'Velocidad de lectura hasta 7450 MB/s con disipador térmico', 6, 'UND', 580.00, 799.00, 4.00),
(29, 'PART-FUENTE-750W', 'Fuente de Poder Corsair RM750e 750W 80 Plus Gold Modular', 'Eficiencia Gold, condensadores japoneses 105C, ventilador silencioso', 6, 'UND', 340.00, 490.00, 3.00),
(30, 'PER-LOGI-GPRO', 'Mouse Gamer Inalámbrico Logitech G Pro X Superlight 2', 'Sensor HERO 2 de 32,000 DPI, menos de 60 gramos de peso', 7, 'UND', 410.00, 590.00, 4.00),
(31, 'PER-RED-KUMARA', 'Teclado Mecánico Redragon Kumara K552 RGB Switch Red', 'Formato compacto Tenkeyless (TKL) con iluminación RGB personalizable', 7, 'UND', 110.00, 169.00, 6.00),
(32, 'PER-AUD-HYPERX', 'Audífonos Gamer HyperX Cloud II Wireless Sonido 7.1', 'Drivers de 53mm, conectividad inalámbrica 2.4GHz sin latencia', 7, 'UND', 310.00, 450.00, 4.00);

-- Stock Inicial en Almacenes
INSERT OR IGNORE INTO inventarios (id, product_id, warehouse_id, stock, reserved_stock) VALUES
(1, 1, 1, 15.00, 0.00),
(2, 2, 1, 12.00, 0.00),
(3, 3, 1, 8.00, 0.00),
(4, 4, 1, 24.00, 0.00),
(5, 5, 1, 10.00, 0.00),
(6, 6, 1, 14.00, 0.00),
(7, 7, 1, 6.00, 0.00),
(8, 8, 1, 10.00, 0.00),
(9, 9, 1, 8.00, 0.00),
(10, 10, 1, 9.00, 0.00),
(11, 11, 1, 7.00, 0.00),
(12, 12, 1, 5.00, 0.00),
(13, 13, 1, 16.00, 0.00),
(14, 14, 1, 12.00, 0.00),
(15, 15, 1, 18.00, 0.00),
(16, 16, 1, 15.00, 0.00),
(17, 17, 1, 8.00, 0.00),
(18, 18, 1, 7.00, 0.00),
(19, 19, 1, 20.00, 0.00),
(20, 20, 1, 10.00, 0.00),
(21, 21, 1, 18.00, 0.00),
(22, 22, 1, 9.00, 0.00),
(23, 23, 1, 14.00, 0.00),
(24, 24, 1, 22.00, 0.00),
(25, 25, 1, 11.00, 0.00),
(26, 26, 1, 12.00, 0.00),
(27, 27, 1, 25.00, 0.00),
(28, 28, 1, 16.00, 0.00),
(29, 29, 1, 14.00, 0.00),
(30, 30, 1, 20.00, 0.00),
(31, 31, 1, 35.00, 0.00),
(32, 32, 1, 15.00, 0.00);

-- Clientes
INSERT OR IGNORE INTO clientes (id, document_type, document_number, name, email, phone, address, credit_limit, current_balance) VALUES
(1, 'RUC', '20601245891', 'Estudio Digital & Diseño Creativo S.A.C.', 'compras@estudiodigital.pe', '+51 987654321', 'Av. Larco 812, Miraflores', 20000.00, 0.00),
(2, 'RUC', '20458932114', 'Gaming Arena Lan Center S.R.L.', 'contacto@gamingarena.pe', '+51 998877665', 'Av. Arenales 1420, Lince', 15000.00, 0.00),
(3, 'DNI', '45892147', 'Ing. Roberto Carlos Zambrano', 'rzambrano@empresa.com', '+51 954123654', 'Jr. Ayacucho 780, Miraflores', 8000.00, 0.00),
(4, 'RUC', '20551294819', 'Colegio Particular San Agustín de Lima', 'administracion@sanagustin.edu.pe', '+51 1 5138000', 'Av. Javier Prado Este 980, San Isidro', 35000.00, 0.00);

-- Proveedores Mayoristas
INSERT OR IGNORE INTO proveedores (id, document_type, document_number, name, contact_name, email, phone, address, credit_limit, current_balance) VALUES
(1, 'RUC', '20100109121', 'Grupo Deltron S.A.', 'Mayorista líder de cómputo, pantallas y componentes', 'ventas@deltron.com.pe', '+51 1 415-0100', 'Av. Manuel Echeandía 261, San Luis, Lima', 80000.00, 0.00),
(2, 'RUC', '20254879201', 'Ingram Micro Perú S.A.C.', 'Distribuidor oficial Apple, Samsung, Lenovo y ASUS', 'contacto@ingrammicro.pe', '+51 1 615-5000', 'Av. República de Panamá 3505, Piso 12, San Isidro', 100000.00, 0.00),
(3, 'RUC', '20381928412', 'Intcomex del Perú S.A.C.', 'Mayorista de smartphones, tablets, pantallas LG y Xiaomi', 'pedidos@intcomex.com.pe', '+51 1 712-4000', 'Av. Materiales 3045, Callao', 60000.00, 0.00);
