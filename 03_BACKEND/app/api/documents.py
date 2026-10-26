from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response
import os
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.core.database import get_db
from app.models.models import Document, User, Sale
from app.schemas.schemas import DocumentOut
from app.core.s3_client import s3_service
from app.security.deps import get_current_user
from app.services.audit_service import log_activity
from app.services.sale_service import generate_invoice_html

router = APIRouter(prefix="/documents", tags=["Gestión Documental Cloud (Amazon S3)"])

@router.get("/", response_model=List[DocumentOut])
def list_documents(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if entity_type:
        query = query.filter(Document.entity_type == entity_type)
    if entity_id:
        query = query.filter(Document.entity_id == entity_id)
    return query.order_by(Document.created_at.desc()).all()

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    unique_filename = f"{uuid.uuid4().hex[:12]}_{file.filename}"
    
    # Subir a S3 o almacenamiento cloud simulado
    upload_res = s3_service.upload_file(
        file_bytes=content,
        filename=unique_filename,
        content_type=file.content_type
    )
    
    doc = Document(
        entity_type=entity_type,
        entity_id=entity_id,
        filename=unique_filename,
        original_name=file.filename,
        mime_type=file.content_type,
        file_size=len(content),
        s3_bucket=upload_res.get("bucket"),
        s3_key=upload_res.get("key"),
        file_url=upload_res.get("url"),
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    log_activity(
        db=db,
        action="SUBIR_DOCUMENTO",
        module="DOCUMENTOS",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(doc.id),
        details=f"Documento subido a {upload_res['storage']}: {doc.original_name} ({len(content)} bytes)"
    )
    return doc

@router.get("/download/{filename}")
def download_document(filename: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter((Document.filename == filename) | (Document.original_name == filename)).first()
    file_info = s3_service.get_file(filename)
    
    # Si no está físicamente en disco y es una factura, regenerar HTML en tiempo real
    if not file_info and doc and doc.entity_type == "VENTAS":
        sale = db.query(Sale).filter(Sale.id == doc.entity_id).first()
        if sale:
            html_content = generate_invoice_html(sale)
            headers = {"Content-Disposition": f'attachment; filename="{doc.original_name or filename}"'}
            return Response(content=html_content.encode("utf-8"), media_type="text/html; charset=utf-8", headers=headers)
            
    if not file_info:
        if "Factura_VTA-" in filename or "VTA-" in filename:
            import re
            m = re.search(r'(VTA-\d{4}-\d+)', filename)
            if m:
                sale = db.query(Sale).filter(Sale.sale_number == m.group(1)).first()
                if sale:
                    html_content = generate_invoice_html(sale)
                    headers = {"Content-Disposition": f'attachment; filename="Factura_{sale.sale_number}.html"'}
                    return Response(content=html_content.encode("utf-8"), media_type="text/html; charset=utf-8", headers=headers)
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el almacenamiento cloud")
        
    download_name = doc.original_name if doc else filename
    if file_info["type"] == "local_file":
        return FileResponse(file_info["path"], filename=download_name)
    else:
        headers = {"Content-Disposition": f'attachment; filename="{download_name}"'}
        return Response(content=file_info["body"], media_type=file_info.get("content_type", "application/octet-stream"), headers=headers)

@router.get("/view/{filename}")
def view_document(filename: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter((Document.filename == filename) | (Document.original_name == filename)).first()
    file_info = s3_service.get_file(filename)
    
    # Si no está físicamente en disco y es una factura, regenerar HTML en tiempo real
    if not file_info and doc and doc.entity_type == "VENTAS":
        sale = db.query(Sale).filter(Sale.id == doc.entity_id).first()
        if sale:
            html_content = generate_invoice_html(sale)
            headers = {"Content-Disposition": f'inline; filename="{doc.original_name or filename}"'}
            return Response(content=html_content.encode("utf-8"), media_type="text/html; charset=utf-8", headers=headers)
            
    if not file_info:
        if "Factura_VTA-" in filename or "VTA-" in filename:
            import re
            m = re.search(r'(VTA-\d{4}-\d+)', filename)
            if m:
                sale = db.query(Sale).filter(Sale.sale_number == m.group(1)).first()
                if sale:
                    html_content = generate_invoice_html(sale)
                    headers = {"Content-Disposition": f'inline; filename="Factura_{sale.sale_number}.html"'}
                    return Response(content=html_content.encode("utf-8"), media_type="text/html; charset=utf-8", headers=headers)
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el almacenamiento cloud")
        
    inline_name = doc.original_name if doc else filename
    media_type = (doc.mime_type if doc and doc.mime_type else None) or file_info.get("content_type", "text/html; charset=utf-8")
    
    if file_info["type"] == "local_file":
        with open(file_info["path"], "rb") as f:
            content = f.read()
        headers = {"Content-Disposition": f'inline; filename="{inline_name}"'}
        return Response(content=content, media_type=media_type, headers=headers)
    else:
        headers = {"Content-Disposition": f'inline; filename="{inline_name}"'}
        return Response(content=file_info["body"], media_type=media_type, headers=headers)

@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Intentar eliminar el archivo fisico local
    try:
        local_path = s3_service.get_local_path(doc.filename) if hasattr(s3_service, 'get_local_path') else None
        if local_path and os.path.exists(local_path):
            os.remove(local_path)
    except Exception:
        pass  # Si falla la eliminacion del archivo fisico, continuar de todas formas

    original_name = doc.original_name
    db.delete(doc)
    db.commit()

    log_activity(
        db=db,
        action="ELIMINAR_DOCUMENTO",
        module="DOCUMENTOS",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(doc_id),
        details=f"Documento eliminado: {original_name}"
    )
    return {"status": "deleted", "id": doc_id, "filename": original_name}
