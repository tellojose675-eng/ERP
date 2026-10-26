from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogOut
from app.security.deps import require_role

from app.services.sale_service import get_peru_time

router = APIRouter(prefix="/audit", tags=["Auditoría y Seguridad"])

@router.get("/", response_model=List[AuditLogOut])
def list_audit_logs(
    module: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Administrador"))
):
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module == module)
    if action:
        query = query.filter(AuditLog.action == action)
        
    logs = query.order_by(AuditLog.created_at.desc()).limit(200).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "username": l.username,
            "action": l.action,
            "module": l.module,
            "record_id": l.record_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "status": l.status,
            "created_at": get_peru_time(l.created_at).isoformat() if l.created_at else get_peru_time().isoformat()
        })
    return results
