import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Sale, SaleDetail, Customer, Product, Document
from app.schemas.schemas import SaleCreate
from app.services.inventory_service import modify_stock
from app.services.audit_service import log_activity
from app.core.s3_client import s3_service

def generate_sale_number(db: Session) -> str:
    count = db.query(Sale).count() + 1
    return f"VTA-{datetime.now().year}-{count:04d}"

def generate_invoice_html(sale: Sale) -> str:
    cust_name = sale.customer.name if sale.customer else "Cliente General"
    cust_doc = f"{sale.customer.document_type}: {sale.customer.document_number}" if sale.customer and sale.customer.document_number else "Documento: Registrado"
    cust_addr = sale.customer.address if sale.customer and sale.customer.address else "Av. Central 123, Lima - Perú"
    
    # Formato de fecha y hora exacta
    date_val = sale.sale_date or datetime.now()
    issue_date_str = date_val.strftime("%d/%m/%Y")
    issue_time_str = date_val.strftime("%I:%M:%S %p")
    wh_name = sale.warehouse.name if hasattr(sale, 'warehouse') and sale.warehouse else "Almacén Principal Lima"
    
    rows_html = ""
    for d in sale.details:
        p_code = d.product.code if d.product else f"P-{d.product_id}"
        p_name = d.product.name if d.product else "Producto Tecnológico"
        p_unit = d.product.unit if d.product and d.product.unit else "UND"
        qty_str = f"{int(d.quantity)}" if float(d.quantity).is_integer() else f"{d.quantity:.2f}"
        rows_html += f"""
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #64748b; font-size: 11px;">{p_code}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; font-size: 12px;">{p_name}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #0284c7; font-size: 12px;">{qty_str} {p_unit}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-size: 12px;">S/. {d.unit_price:.2f}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a; font-size: 12px;">S/. {d.total:.2f}</td>
        </tr>
        """
        
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura Electrónica {sale.sale_number} - ERP TECHSTORE</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; }}
  .invoice-card {{ max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; padding: 36px; }}
  .header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; gap: 20px; }}
  .company-title {{ font-size: 22px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; margin-bottom: 4px; }}
  .company-sub {{ font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px; }}
  .company-info {{ font-size: 11px; color: #64748b; line-height: 1.5; }}
  .fiscal-box {{ border: 2px solid #0f172a; border-radius: 14px; padding: 14px 20px; text-align: center; background: #f8fafc; min-width: 220px; }}
  .fiscal-ruc {{ font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 1px; }}
  .fiscal-type {{ font-size: 15px; font-weight: 900; color: #0f172a; margin: 6px 0; text-transform: uppercase; }}
  .fiscal-num {{ font-size: 14px; font-weight: 800; font-family: monospace; color: #0369a1; }}
  .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px; font-size: 12px; }}
  .meta-title {{ font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }}
  .meta-name {{ font-size: 14px; font-weight: 700; color: #0f172a; }}
  .meta-right {{ text-align: right; line-height: 1.7; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }}
  th {{ background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; font-weight: 700; padding: 10px 12px; text-align: left; }}
  .footer-flex {{ display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; gap: 20px; }}
  .totals-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; width: 260px; font-size: 12px; line-height: 1.8; }}
  .total-row {{ display: flex; justify-content: space-between; }}
  .total-final {{ display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 6px; font-size: 15px; font-weight: 800; color: #0f172a; }}
  .s3-badge {{ display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; margin-top: 10px; }}
</style>
</head>
<body>
<div class="invoice-card">
  <div class="header">
    <div>
      <div class="company-title">ERP TECHSTORE S.A.C.</div>
      <div class="company-sub">Venta de Cómputo • Pantallas, Móviles, Tablets & CPUs</div>
      <div class="company-info">
        Av. Javier Prado Este 4500, San Isidro, Lima - Perú<br>
        Tel: +51 (1) 619-8000 | Email: ventas@techstore.pe
      </div>
    </div>
    <div class="fiscal-box">
      <div class="fiscal-ruc">R.U.C. 20984719283</div>
      <div class="fiscal-type">{'COTIZACIÓN COMERCIAL' if sale.status == 'COTIZACION' else 'FACTURA ELECTRÓNICA'}</div>
      <div class="fiscal-num">{sale.sale_number}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-title">Adquiriente / Cliente</div>
      <div class="meta-name">{cust_name}</div>
      <div style="color: #64748b; margin-top: 3px; font-family: monospace;">{cust_doc}</div>
      <div style="color: #64748b; margin-top: 2px;">Dirección: {cust_addr}</div>
      <div style="color: #64748b;">Moneda: SOLES (S/.)</div>
    </div>
    <div class="meta-right">
      <div><span style="color: #94a3b8;">Fecha de Emisión:</span> <b style="font-family: monospace; color: #0f172a;">{issue_date_str}</b></div>
      <div><span style="color: #94a3b8;">Hora Exacta:</span> <b style="font-family: monospace; color: #0284c7;">{issue_time_str}</b></div>
      <div><span style="color: #94a3b8;">Condición Pago:</span> <b>{sale.payment_status}</b></div>
      <div><span style="color: #94a3b8;">Almacén Despacho:</span> <b>{wh_name}</b></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descripción</th>
        <th style="text-align: center;">Cant.</th>
        <th style="text-align: right;">Precio Unit.</th>
        <th style="text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>

  <div class="footer-flex">
    <div>
      <div class="s3-badge">☁️ Archivado Automáticamente en Amazon S3</div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 8px; max-width: 380px;">
        Representación digital de la Factura Electrónica. Respaldo elástico consultable en el módulo de Archivos Cloud (S3).
      </div>
    </div>
    <div class="totals-box">
      <div class="total-row"><span>Op. Gravadas:</span> <span style="font-family: monospace; font-weight: 600;">S/. {sale.subtotal:.2f}</span></div>
      <div class="total-row"><span>I.G.V. (18%):</span> <span style="font-family: monospace; font-weight: 600;">S/. {sale.tax:.2f}</span></div>
      <div class="total-final"><span>TOTAL:</span> <span style="font-family: monospace; color: #0284c7;">S/. {sale.total:.2f}</span></div>
    </div>
  </div>
</div>
</body>
</html>"""
    return html

def archive_sale_invoice_to_s3(db: Session, sale: Sale, user_id: int):
    """Genera y archiva automáticamente la factura en Amazon S3 / Documentos."""
    try:
        invoice_html = generate_invoice_html(sale)
        invoice_bytes = invoice_html.encode("utf-8")
        unique_name = f"Factura_{sale.sale_number}_{uuid.uuid4().hex[:6]}.html"
        
        upload_res = s3_service.upload_file(
            file_bytes=invoice_bytes,
            filename=unique_name,
            content_type="text/html"
        )
        
        # Verificar si ya existía un documento para esta venta para no duplicar
        existing_doc = db.query(Document).filter(
            Document.entity_type == "VENTAS",
            Document.entity_id == sale.id,
            Document.original_name.like(f"%{sale.sale_number}%")
        ).first()
        
        if not existing_doc:
            doc = Document(
                entity_type="VENTAS",
                entity_id=sale.id,
                filename=upload_res.get("filename", unique_name),
                original_name=f"Factura_{sale.sale_number}.html",
                mime_type="text/html",
                file_size=len(invoice_bytes),
                s3_bucket=upload_res.get("bucket"),
                s3_key=upload_res.get("key"),
                file_url=upload_res.get("url"),
                uploaded_by=user_id
            )
            db.add(doc)
            db.commit()
    except Exception as e:
        print(f"[Error archivando factura en S3]: {e}")

def create_sale(db: Session, sale_in: SaleCreate, user_id: int, username: str) -> Sale:
    customer = db.query(Customer).filter(Customer.id == sale_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    sale_number = generate_sale_number(db)
    
    # Calcular totales
    subtotal = 0.0
    tax_total = 0.0
    items_to_create = []
    
    for item in sale_in.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto ID {item.product_id} no encontrado")
        
        line_subtotal = round(item.quantity * item.unit_price, 2)
        line_tax = round(line_subtotal * 0.18, 2) # IGV 18%
        line_total = line_subtotal + line_tax
        
        subtotal += line_subtotal
        tax_total += line_tax
        
        items_to_create.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": line_subtotal,
            "tax": line_tax,
            "total": line_total
        })
    
    total = round(subtotal + tax_total, 2)
    current_time = datetime.now()
    
    sale = Sale(
        sale_number=sale_number,
        customer_id=customer.id,
        warehouse_id=sale_in.warehouse_id,
        status=sale_in.status or "FACTURADA",
        subtotal=subtotal,
        tax=tax_total,
        total=total,
        paid_amount=0.0,
        payment_status="PENDIENTE",
        notes=sale_in.notes,
        created_by=user_id,
        sale_date=current_time
    )
    db.add(sale)
    db.flush()
    
    # Crear los detalles
    for item_data in items_to_create:
        detail = SaleDetail(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
            tax=item_data["tax"],
            total=item_data["total"]
        )
        db.add(detail)
        
        # Descontar inventario si es Facturada o Pedido
        if sale.status in ("FACTURADA", "PEDIDO"):
            modify_stock(
                db=db,
                product_id=item_data["product_id"],
                warehouse_id=sale_in.warehouse_id,
                quantity=item_data["quantity"],
                movement_type="SALIDA",
                reference_type="VENTA",
                reference_id=sale.id,
                notes=f"Venta {sale.sale_number} para {customer.name}",
                user_id=user_id
            )
            
    # Actualizar saldo pendiente en Cuentas por Cobrar (CxC) del cliente
    if sale.status == "FACTURADA":
        customer.current_balance = round(customer.current_balance + total, 2)
        
    db.commit()
    db.refresh(sale)
    
    # Guardar automáticamente la factura en el módulo Archivos Cloud (S3)
    archive_sale_invoice_to_s3(db=db, sale=sale, user_id=user_id)
    
    # Auditoría
    log_activity(
        db=db,
        action="CREAR",
        module="VENTAS",
        user_id=user_id,
        username=username,
        record_id=str(sale.id),
        details=f"Emisión de comprobante {sale.sale_number} por S/. {sale.total} (Archivada en Cloud S3)"
    )
    
    return sale
