import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_deltron_invoice(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1E293B'),
        leading=18
    )
    
    sub_style = ParagraphStyle(
        'InvoiceSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor('#64748B'),
        leading=11
    )
    
    box_num_style = ParagraphStyle(
        'BoxNum',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#0F172A'),
        alignment=1, # Center
        leading=16
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=colors.HexColor('#1E293B'),
        leading=11
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=colors.HexColor('#1E293B'),
        leading=11
    )

    elements = []

    # 1. Header (Company Info + Invoice Box)
    company_info = [
        Paragraph("<b>GRUPO DELTRON S.A.</b>", title_style),
        Paragraph("Distribuidor Mayorista de Tecnología & Cómputo", sub_style),
        Paragraph("Av. Manuel Olguín 325, Of. 802, Santiago de Surco - Lima", sub_style),
        Paragraph("Teléfono: (01) 612-4000 | Email: ventas@deltron.com.pe", sub_style),
        Paragraph("Web: www.deltron.com.pe", sub_style),
    ]

    invoice_box = [
        Paragraph("<b>R.U.C. 20100109121</b>", box_num_style),
        Spacer(1, 4),
        Paragraph("<b>FACTURA ELECTRÓNICA</b>", box_num_style),
        Spacer(1, 4),
        Paragraph("<b>F001-0004521</b>", box_num_style),
    ]

    header_table = Table(
        [[company_info, invoice_box]],
        colWidths=[330, 210]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (1,0), (1,0), 1.5, colors.HexColor('#3B82F6')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#EFF6FF')),
        ('TOPPADDING', (1,0), (1,0), 10),
        ('BOTTOMPADDING', (1,0), (1,0), 10),
        ('LEFTPADDING', (1,0), (1,0), 10),
        ('RIGHTPADDING', (1,0), (1,0), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 14))

    # 2. Customer / Client details box
    client_data = [
        [
            Paragraph("<b>Señor(es):</b> ERP TECHSTORE PERÚ S.A.C.", cell_style),
            Paragraph("<b>Fecha Emisión:</b> 2026-10-28", cell_style)
        ],
        [
            Paragraph("<b>R.U.C. Cliente:</b> 20601234567", cell_style),
            Paragraph("<b>Moneda:</b> SOLES (PEN)", cell_style)
        ],
        [
            Paragraph("<b>Dirección:</b> Av. Javier Prado Este 4500, Lima", cell_style),
            Paragraph("<b>Condición Pago:</b> Crédito 15 días", cell_style)
        ],
        [
            Paragraph("<b>Guía Remisión:</b> T001-001289", cell_style),
            Paragraph("<b>Orden Compra:</b> OC-2026-0089", cell_style)
        ]
    ]
    client_table = Table(client_data, colWidths=[340, 200])
    client_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 14))

    # 3. Product items table
    items_header = [
        Paragraph("<b>CÓDIGO</b>", cell_bold),
        Paragraph("<b>DESCRIPCIÓN DEL ARTÍCULO</b>", cell_bold),
        Paragraph("<b>CANT.</b>", cell_bold),
        Paragraph("<b>P. UNIT</b>", cell_bold),
        Paragraph("<b>TOTAL (S/.)</b>", cell_bold),
    ]

    items_rows = [
        items_header,
        [
            Paragraph("MON-LG-27GP850", cell_style),
            Paragraph("Monitor Gaming LG UltraGear 27'' QHD 165Hz Nano IPS 1ms G-Sync", cell_style),
            Paragraph("2.00", cell_style),
            Paragraph("950.00", cell_style),
            Paragraph("1,900.00", cell_style),
        ],
        [
            Paragraph("PART-GPU-RTX4060", cell_style),
            Paragraph("Tarjeta de Video ASUS Dual GeForce RTX 4060 OC 8GB GDDR6 DLSS 3", cell_style),
            Paragraph("3.00", cell_style),
            Paragraph("1,050.00", cell_style),
            Paragraph("3,150.00", cell_style),
        ],
        [
            Paragraph("PART-RAM-DDR5-32", cell_style),
            Paragraph("Memoria RAM Kingston FURY Beast DDR5 32GB (2x16GB) 6000MHz Intel XMP", cell_style),
            Paragraph("4.00", cell_style),
            Paragraph("380.00", cell_style),
            Paragraph("1,520.00", cell_style),
        ],
    ]

    items_table = Table(items_rows, colWidths=[90, 270, 50, 65, 65])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    
    # Header text colors white
    for i in range(len(items_header)):
        items_header[i].style.textColor = colors.white

    elements.append(items_table)
    elements.append(Spacer(1, 10))

    # 4. Totals and Summary Table
    # Subtotal = 1900 + 3150 + 1520 = 6570.00
    # IGV (18%) = 1182.60
    # Total = 7752.60
    totals_data = [
        [
            Paragraph("<b>SON:</b> SIETE MIL SETECIENTOS CINCUENTA Y DOS CON 60/100 SOLES", sub_style),
            Paragraph("<b>Op. Gravada:</b>", cell_style),
            Paragraph("S/. 6,570.00", cell_bold)
        ],
        [
            Paragraph("Representación impresa de la Factura Electrónica generada en el sistema SUNAT.", sub_style),
            Paragraph("<b>I.G.V. (18%):</b>", cell_style),
            Paragraph("S/. 1,182.60", cell_bold)
        ],
        [
            Paragraph("Hash CDR: aK89+Xqwe2901lmOPq=", sub_style),
            Paragraph("<b>IMPORTE TOTAL:</b>", cell_bold),
            Paragraph("<b>S/. 7,752.60</b>", cell_bold)
        ]
    ]
    totals_table = Table(totals_data, colWidths=[350, 95, 95])
    totals_table.setStyle(TableStyle([
        ('BOX', (1,0), (-1,-1), 1, colors.HexColor('#1E293B')),
        ('BACKGROUND', (1,2), (-1,2), colors.HexColor('#EFF6FF')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(totals_table)

    doc.build(elements)
    print(f"Factura generada con éxito en: {output_path}")

def create_techdata_invoice(output_path: str):

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'InvoiceTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#0F172A'), leading=18
    )
    sub_style = ParagraphStyle(
        'InvoiceSub', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#64748B'), leading=11
    )
    box_num_style = ParagraphStyle(
        'BoxNum', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor('#0F172A'), alignment=1, leading=16
    )
    cell_style = ParagraphStyle(
        'CellText', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, textColor=colors.HexColor('#1E293B'), leading=11
    )
    cell_bold = ParagraphStyle(
        'CellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor('#1E293B'), leading=11
    )

    elements = []

    # 1. Header
    company_info = [
        Paragraph("<b>TECH DATA DISTRIBUIDORA MAYORISTA S.A.</b>", title_style),
        Paragraph("Importación y Distribución Mayorista de Cómputo & Gadgets", sub_style),
        Paragraph("Av. Rivera Navarrete 501, Piso 14, San Isidro - Lima", sub_style),
        Paragraph("Teléfono: (01) 513-8800 | Email: ventas.pe@techdata.com", sub_style),
        Paragraph("Web: www.techdata.pe", sub_style),
    ]

    invoice_box = [
        Paragraph("<b>R.U.C. 20100458923</b>", box_num_style),
        Spacer(1, 4),
        Paragraph("<b>FACTURA ELECTRÓNICA</b>", box_num_style),
        Spacer(1, 4),
        Paragraph("<b>F002-0008912</b>", box_num_style),
    ]

    header_table = Table([[company_info, invoice_box]], colWidths=[330, 210])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (1,0), (1,0), 1.5, colors.HexColor('#6366F1')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#EEF2FF')),
        ('TOPPADDING', (1,0), (1,0), 10),
        ('BOTTOMPADDING', (1,0), (1,0), 10),
        ('LEFTPADDING', (1,0), (1,0), 10),
        ('RIGHTPADDING', (1,0), (1,0), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 14))

    # 2. Client Info
    client_data = [
        [Paragraph("<b>Señor(es):</b> ERP TECHSTORE PERÚ S.A.C.", cell_style), Paragraph("<b>Fecha Emisión:</b> 2026-10-29", cell_style)],
        [Paragraph("<b>R.U.C. Cliente:</b> 20601234567", cell_style), Paragraph("<b>Moneda:</b> SOLES (PEN)", cell_style)],
        [Paragraph("<b>Dirección:</b> Av. Javier Prado Este 4500, Lima", cell_style), Paragraph("<b>Condición:</b> Factura a 30 días", cell_style)],
    ]
    client_table = Table(client_data, colWidths=[340, 200])
    client_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 14))

    # 3. Items
    items_header = [
        Paragraph("<b>CÓDIGO</b>", cell_bold),
        Paragraph("<b>DESCRIPCIÓN DEL ARTÍCULO</b>", cell_bold),
        Paragraph("<b>CANT.</b>", cell_bold),
        Paragraph("<b>P. UNIT</b>", cell_bold),
        Paragraph("<b>TOTAL (S/.)</b>", cell_bold),
    ]

    items_rows = [
        items_header,
        [
            Paragraph("LAP-ASUS-G16", cell_style),
            Paragraph("Laptop ASUS ROG Strix G16 Core i7 16GB RTX 4060 512GB SSD", cell_style),
            Paragraph("1.00", cell_style),
            Paragraph("3,800.00", cell_style),
            Paragraph("3,800.00", cell_style),
        ],
        [
            Paragraph("CEL-SAM-S24U", cell_style),
            Paragraph("Samsung Galaxy S24 Ultra 256GB 5G Titanium Black S-Pen", cell_style),
            Paragraph("2.00", cell_style),
            Paragraph("3,950.00", cell_style),
            Paragraph("7,900.00", cell_style),
        ],
    ]

    items_table = Table(items_rows, colWidths=[90, 270, 50, 65, 65])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#312E81')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    for i in range(len(items_header)):
        items_header[i].style.textColor = colors.white

    elements.append(items_table)
    elements.append(Spacer(1, 10))

    # 4. Totals: 3800 + 7900 = 11,700.00. IGV: 2,106.00. Total: 13,806.00
    totals_data = [
        [Paragraph("<b>SON:</b> TRECE MIL OCHOCIENTOS SEIS CON 00/100 SOLES", sub_style), Paragraph("<b>Op. Gravada:</b>", cell_style), Paragraph("S/. 11,700.00", cell_bold)],
        [Paragraph("Representación impresa de Factura Electrónica SUNAT.", sub_style), Paragraph("<b>I.G.V. (18%):</b>", cell_style), Paragraph("S/. 2,106.00", cell_bold)],
        [Paragraph("Constancia de Recepción CDR Aprobada.", sub_style), Paragraph("<b>IMPORTE TOTAL:</b>", cell_bold), Paragraph("<b>S/. 13,806.00</b>", cell_bold)]
    ]
    totals_table = Table(totals_data, colWidths=[350, 95, 95])
    totals_table.setStyle(TableStyle([
        ('BOX', (1,0), (-1,-1), 1, colors.HexColor('#312E81')),
        ('BACKGROUND', (1,2), (-1,2), colors.HexColor('#EEF2FF')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(totals_table)

    doc.build(elements)
    print(f"Factura generada con éxito en: {output_path}")

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    create_deltron_invoice(os.path.join(base, "FACTURA_PRUEBA_DELTRON.pdf"))
    create_techdata_invoice(os.path.join(base, "FACTURA_PRUEBA_TECHDATA.pdf"))

