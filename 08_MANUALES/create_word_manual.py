import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color_hex):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner margins (padding) of a table cell in twentieths of a point (dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'  <w:top w:w="{top}" w:type="dxa"/>'
        f'  <w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'  <w:left w:w="{left}" w:type="dxa"/>'
        f'  <w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    """Set subtle borders for an entire table."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_callout(doc, text_content, callout_type="NOTE"):
    """Creates a beautifully styled callout box with colored left border."""
    colors = {
        "NOTE": {"border": "2563EB", "fill": "EFF6FF", "title": "NOTA INFORMATIVA", "title_color": "1E40AF"},
        "TIP": {"border": "059669", "fill": "ECFDF5", "title": "CONSEJO PRÁCTICO", "title_color": "065F46"},
        "IMPORTANT": {"border": "D97706", "fill": "FFFBEB", "title": "IMPORTANTE", "title_color": "92400E"},
        "WARNING": {"border": "DC2626", "fill": "FEF2F2", "title": "ADVERTENCIA", "title_color": "991B1B"},
    }
    cfg = colors.get(callout_type, colors["NOTE"])
    
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_shading(cell, cfg["fill"])
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    # Left border only
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="none"/>'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{cfg["border"]}"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    run_title = p.add_run(f"📌 {cfg['title']}: ")
    run_title.bold = True
    run_title.font.name = "Arial"
    run_title.font.size = Pt(9.5)
    run_title.font.color.rgb = RGBColor.from_string(cfg["title_color"])
    
    run_text = p.add_run(text_content)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(51, 65, 85)
    
    # add space after callout table
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(6)

def add_code_block(doc, text):
    """Add a monospace framed box for ASCII diagrams or code."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_shading(cell, "F8FAFC")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>'
        f'  <w:left w:val="single" w:sz="18" w:space="0" w:color="94A3B8"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>'
        f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(30, 41, 59)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(6)

def create_manual():
    md_path = r"c:\Users\jose2\Desktop\erp zambrano\08_MANUALES\Manual_Usuario.md"
    docx_path = r"c:\Users\jose2\Desktop\erp zambrano\08_MANUALES\Manual_de_Usuario_ERP_EnterpriseCloud.docx"
    
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    doc = Document()
    
    # Configure 1 inch page margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)
        
        # Header & Footer setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("ERP EnterpriseCloud · Manual de Usuario Oficial | Confidencial")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8)
        hrun.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun1 = fp.add_run("Código: MAN-USR-ERP-2026-v2.5  |  AWS Cloud Edition")
        frun1.font.name = "Arial"
        frun1.font.size = Pt(8)
        frun1.font.color.rgb = RGBColor(148, 163, 184)

    # ─────────────────────────────────────────────────────────────
    # PORTADA CORPORATIVA
    # ─────────────────────────────────────────────────────────────
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(40)
    p_pre.paragraph_format.space_after = Pt(6)
    r_pre = p_pre.add_run("SISTEMA INTEGRADO DE GESTIÓN EMPRESARIAL EN LA NUBE")
    r_pre.font.name = "Arial"
    r_pre.font.size = Pt(11)
    r_pre.bold = True
    r_pre.font.color.rgb = RGBColor(37, 99, 235)  # Royal Blue

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("MANUAL DE USUARIO")
    r_title.font.name = "Arial Black"
    r_title.font.size = Pt(32)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)  # Slate 900

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(18)
    r_sub = p_sub.add_run("ERP EnterpriseCloud — Edición AWS Cloud & Local")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Accent horizontal bar
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_before = Pt(0)
    p_line.paragraph_format.space_after = Pt(28)
    r_line = p_line.add_run("―" * 52)
    r_line.font.name = "Arial"
    r_line.font.size = Pt(12)
    r_line.font.color.rgb = RGBColor(37, 99, 235)

    p_desc = doc.add_paragraph()
    p_desc.paragraph_format.space_before = Pt(0)
    p_desc.paragraph_format.space_after = Pt(30)
    r_desc = p_desc.add_run(
        "Guía completa de operación paso a paso para usuarios finales, ejecutivos comerciales, "
        "jefes de compras, encargados de logística y almacén, analistas contables y administradores "
        "del sistema. Incluye gestión de comprobantes, control de inventario en Kardex, "
        "flujo de caja, administración de roles RBAC y archivo documental en Amazon S3."
    )
    p_desc.paragraph_format.line_spacing = 1.3
    r_desc.font.name = "Arial"
    r_desc.font.size = Pt(10.5)
    r_desc.font.color.rgb = RGBColor(51, 65, 85)

    # Cover Metadata Table
    table_meta = doc.add_table(rows=6, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meta.autofit = False
    set_table_borders(table_meta, color="E2E8F0", sz="6")
    
    meta_data = [
        ("Código de Documento:", "MAN-USR-ERP-2026-v2.5"),
        ("Versión del Software:", "Release 2.5.0 (FastAPI + React + AWS S3)"),
        ("Fecha de Publicación:", "Octubre 2026"),
        ("Arquitectura Cloud:", "Amazon EC2, Amazon RDS PostgreSQL, Amazon S3"),
        ("Seguridad y Acceso:", "Autenticación JWT Criptográfica + RBAC 5 Roles"),
        ("Clasificación:", "Confidencial / Manual Corporativo Oficial")
    ]
    
    for i, (k, v) in enumerate(meta_data):
        cell_k = table_meta.cell(i, 0)
        cell_v = table_meta.cell(i, 1)
        cell_k.width = Inches(2.2)
        cell_v.width = Inches(4.3)
        set_cell_shading(cell_k, "F1F5F9")
        set_cell_shading(cell_v, "FFFFFF")
        set_cell_margins(cell_k, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_v, top=80, bottom=80, left=120, right=120)
        
        pk = cell_k.paragraphs[0]
        pk.paragraph_format.space_before = Pt(0)
        pk.paragraph_format.space_after = Pt(0)
        rk = pk.add_run(k)
        rk.font.name = "Arial"
        rk.font.size = Pt(9.5)
        rk.bold = True
        rk.font.color.rgb = RGBColor(30, 41, 59)
        
        pv = cell_v.paragraphs[0]
        pv.paragraph_format.space_before = Pt(0)
        pv.paragraph_format.space_after = Pt(0)
        rv = pv.add_run(v)
        rv.font.name = "Arial"
        rv.font.size = Pt(9.5)
        rv.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_page_break()

    # ─────────────────────────────────────────────────────────────
    # PARSER DE CONTENIDO MARKDOWN
    # ─────────────────────────────────────────────────────────────
    lines = md_text.split("\n")
    
    i = 0
    in_code_block = False
    code_buffer = []
    in_table = False
    table_rows = []
    
    def render_inline(p, text):
        """Parse simple bold and code tokens inside text."""
        tokens = re.split(r'(\*\*.*?\*\*|`.*?`|\*.*?\*)', text)
        for token in tokens:
            if not token:
                continue
            if token.startswith("**") and token.endswith("**"):
                r = p.add_run(token[2:-2])
                r.bold = True
            elif token.startswith("`") and token.endswith("`"):
                r = p.add_run(token[1:-1])
                r.font.name = "Consolas"
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(190, 24, 93)  # Rose
            elif token.startswith("*") and token.endswith("*"):
                r = p.add_run(token[1:-1])
                r.italic = True
            else:
                r = p.add_run(token)
            r.font.name = "Arial"

    def flush_table(rows):
        if not rows:
            return
        # Filter separator row (e.g., | :--- | :--- |)
        filtered_rows = []
        for r in rows:
            clean = [c.strip() for c in r.split("|")[1:-1]]
            if not all(re.match(r'^:?-+:?$', c) for c in clean if c):
                filtered_rows.append(clean)
        
        if not filtered_rows:
            return
            
        num_cols = max(len(r) for r in filtered_rows)
        tbl = doc.add_table(rows=len(filtered_rows), cols=num_cols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        set_table_borders(tbl, color="CBD5E1", sz="4")
        
        total_width = 6.5
        col_w = total_width / num_cols
        
        for r_idx, row_data in enumerate(filtered_rows):
            is_header = (r_idx == 0)
            for c_idx in range(num_cols):
                cell = tbl.cell(r_idx, c_idx)
                cell.width = Inches(col_w)
                set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
                cell_text = row_data[c_idx] if c_idx < len(row_data) else ""
                
                if is_header:
                    set_cell_shading(cell, "1E3A8A")  # Navy Blue
                else:
                    if r_idx % 2 == 1:
                        set_cell_shading(cell, "FFFFFF")
                    else:
                        set_cell_shading(cell, "F8FAFC")  # Subtle zebra
                
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                
                # Check for icons or emojis
                render_inline(p, cell_text)
                for run in p.runs:
                    run.font.name = "Arial"
                    if is_header:
                        run.font.size = Pt(9)
                        run.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
                    else:
                        run.font.size = Pt(8.5)
                        run.font.color.rgb = RGBColor(51, 65, 85)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(0)
        p_spacer.paragraph_format.space_after = Pt(6)

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Handle code blocks
        if stripped.startswith("```"):
            if in_code_block:
                add_code_block(doc, "\n".join(code_buffer))
                code_buffer = []
                in_code_block = False
            else:
                in_code_block = True
                code_buffer = []
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        # Handle tables
        if stripped.startswith("|") and stripped.endswith("|"):
            in_table = True
            table_rows.append(stripped)
            i += 1
            continue
        elif in_table:
            flush_table(table_rows)
            table_rows = []
            in_table = False

        # Ignore decorative banner lines
        if stripped.startswith("---") or stripped.startswith("==="):
            i += 1
            continue

        # Ignore markdown control lines like "> [!NOTE]"
        if stripped.startswith("> [!"):
            callout_type = "NOTE"
            if "NOTE" in stripped:
                callout_type = "NOTE"
            elif "TIP" in stripped:
                callout_type = "TIP"
            elif "IMPORTANT" in stripped:
                callout_type = "IMPORTANT"
            elif "WARNING" in stripped or "CAUTION" in stripped:
                callout_type = "WARNING"
            
            # Read subsequent lines belonging to this blockquote
            bq_lines = []
            i += 1
            while i < len(lines) and lines[i].strip().startswith(">"):
                content_line = lines[i].strip()[1:].strip()
                if content_line:
                    bq_lines.append(content_line)
                i += 1
            add_callout(doc, " ".join(bq_lines), callout_type=callout_type)
            continue

        # Standard blockquote
        if stripped.startswith(">"):
            quote_text = stripped[1:].strip()
            add_callout(doc, quote_text, callout_type="NOTE")
            i += 1
            continue

        # Headings
        if stripped.startswith("# "):
            # Heading 1
            h_text = stripped[2:].strip()
            # If it's the title we already put on cover, skip or keep as section
            if "Manual de Usuario" not in h_text:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(18)
                p.paragraph_format.space_after = Pt(6)
                p.paragraph_format.keep_with_next = True
                r = p.add_run(h_text)
                r.font.name = "Arial Black"
                r.font.size = Pt(16)
                r.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            i += 1
            continue

        if stripped.startswith("## "):
            h_text = stripped[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Arial"
            r.font.size = Pt(13)
            r.bold = True
            r.font.color.rgb = RGBColor(30, 58, 138)  # Dark Blue
            i += 1
            continue

        if stripped.startswith("### "):
            h_text = stripped[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Arial"
            r.font.size = Pt(11)
            r.bold = True
            r.font.color.rgb = RGBColor(37, 99, 235)  # Medium Blue
            i += 1
            continue

        if stripped.startswith("#### "):
            h_text = stripped[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Arial"
            r.font.size = Pt(10)
            r.bold = True
            r.font.color.rgb = RGBColor(71, 85, 105)
            i += 1
            continue

        # Bullet lists (* or -)
        if stripped.startswith("* ") or stripped.startswith("- "):
            item_text = stripped[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            render_inline(p, item_text)
            for run in p.runs:
                if not run.font.size:
                    run.font.size = Pt(9.5)
                run.font.name = "Arial"
            i += 1
            continue

        # Numbered lists (1. or 2.)
        num_match = re.match(r'^(\d+)\.\s+(.*)$', stripped)
        if num_match:
            item_text = num_match.group(2).strip()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            render_inline(p, item_text)
            for run in p.runs:
                if not run.font.size:
                    run.font.size = Pt(9.5)
                run.font.name = "Arial"
            i += 1
            continue

        # Plain paragraphs
        if stripped:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(5)
            p.paragraph_format.line_spacing = 1.2
            render_inline(p, stripped)
            for run in p.runs:
                if not run.font.size:
                    run.font.size = Pt(9.5)
                run.font.name = "Arial"

        i += 1

    # End of document table flush if needed
    if in_table:
        flush_table(table_rows)

    doc.save(docx_path)
    print(f"Documento Word generado exitosamente en: {docx_path}")

if __name__ == "__main__":
    create_manual()
