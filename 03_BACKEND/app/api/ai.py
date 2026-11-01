from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.security.deps import get_current_user
from app.services import ai_service
from app.services.audit_service import log_activity

router = APIRouter(prefix="/ai", tags=["Inteligencia Artificial"])

@router.get("/status")
def get_ai_status():
    """Retorna el estado del motor de IA y el proveedor activo."""
    return ai_service.get_ai_status()

@router.get("/business-insights")
def get_business_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna métricas clave y resúmenes de negocio procesados por IA."""
    return ai_service.get_business_context_summary(db)

@router.post("/chat", response_model=AIChatResponse)
async def chat_copilot(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Consulta al Copiloto Inteligente de Negocio en lenguaje natural."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
        
    result = await ai_service.chat_with_copilot(
        message=request.message.strip(),
        history=request.history or [],
        user_name=current_user.full_name or current_user.username,
        user_role=current_user.role.name if current_user.role else "Usuario",
        db=db
    )
    
    # Registrar auditoría de consulta de IA
    log_activity(
        db=db,
        action="CONSULTA_COPILOTO_IA",
        module="IA",
        status="EXITOSO",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Consulta: '{request.message[:60]}...' | Fuente: {result.get('source')}"
    )
    
    return AIChatResponse(
        reply=result["reply"],
        suggested_actions=result.get("suggested_actions", []),
        source=result.get("source", "analyst_engine")
    )

@router.post("/extract-invoice")
async def extract_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Procesa un archivo PDF o imagen de factura y extrae datos estructurados conciliados con el ERP."""
    allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
    
    # Validar tipo de archivo
    content_type = file.content_type or "application/octet-stream"
    filename_lower = file.filename.lower() if file.filename else ""
    
    is_valid_type = (
        content_type in allowed_types or
        filename_lower.endswith((".pdf", ".png", ".jpg", ".jpeg", ".webp"))
    )
    
    if not is_valid_type:
        raise HTTPException(
            status_code=400,
            detail="Formato no admitido. Por favor suba un archivo PDF o una imagen (PNG, JPG, WEBP)."
        )
        
    # Leer contenido del archivo
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="El archivo subido está vacío")
        
    if len(file_bytes) > 10 * 1024 * 1024: # Límite 10 MB
        raise HTTPException(status_code=400, detail="El archivo supera el tamaño máximo permitido de 10 MB")
        
    try:
        extraction_result = await ai_service.extract_invoice_data(
            file_bytes=file_bytes,
            filename=file.filename or "factura.pdf",
            content_type=content_type,
            db=db
        )
        
        log_activity(
            db=db,
            action="OCR_FACTURA_IA",
            module="COMPRAS_IA",
            status="EXITOSO",
            user_id=current_user.id,
            username=current_user.username,
            details=f"Archivo: {file.filename} | Factura: {extraction_result.get('invoice_number')} | Items: {extraction_result.get('items_count')}"
        )
        
        return extraction_result
    except Exception as e:
        log_activity(
            db=db,
            action="OCR_FACTURA_IA",
            module="COMPRAS_IA",
            status="ERROR",
            user_id=current_user.id,
            username=current_user.username,
            details=f"Error al procesar {file.filename}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=f"Error al procesar la factura con IA: {str(e)}")
