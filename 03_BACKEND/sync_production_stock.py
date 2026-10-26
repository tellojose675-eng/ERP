import urllib.request
import json
import time

def sync_production_stock():
    # 1. Login
    login_url = "https://erp-backend-r50k.onrender.com/api/v1/auth/login"
    login_data = json.dumps({"username": "admin", "password": "admin123"}).encode("utf-8")
    req = urllib.request.Request(login_url, data=login_data, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode("utf-8"))["access_token"]
    print("Autenticación en Render exitosa.")

    # 2. Get all products
    prods_url = "https://erp-backend-r50k.onrender.com/api/v1/products/"
    req_prods = urllib.request.Request(prods_url)
    with urllib.request.urlopen(req_prods) as resp:
        products = json.loads(resp.read().decode("utf-8"))

    print(f"Total productos en producción: {len(products)}")

    # 3. Adjust each product to 10 units in warehouse 1
    updated = 0
    adjust_url = "https://erp-backend-r50k.onrender.com/api/v1/inventory/adjust"
    for p in products:
        p_id = p["id"]
        adj_data = json.dumps({
            "product_id": p_id,
            "warehouse_id": 1,
            "quantity": 10.0,
            "movement_type": "AJUSTE",
            "notes": "Ajuste inicial a 10 unidades"
        }).encode("utf-8")

        req_adj = urllib.request.Request(
            adjust_url,
            data=adj_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        try:
            with urllib.request.urlopen(req_adj) as resp:
                updated += 1
        except Exception as e:
            print(f"Error en producto {p_id} ({p.get('name')}): {e}")

    print(f"Productos actualizados exitosamente en producción: {updated}/{len(products)}")

    # 4. Verify all products
    with urllib.request.urlopen(urllib.request.Request(prods_url)) as resp:
        verify_prods = json.loads(resp.read().decode("utf-8"))

    all_10 = all(p.get("total_stock") == 10.0 for p in verify_prods)
    print("Verificación de que TODOS los productos tienen 10 unidades en producción:", all_10)

if __name__ == "__main__":
    sync_production_stock()
