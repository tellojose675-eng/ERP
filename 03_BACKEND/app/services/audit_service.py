from sqlalchemy.orm import Session
from app.models.models import AuditLog
from typing import Optional

def log_activity(
    db: Session,
    action: str,
    module: str,
    user_id: Optional[int] = None,
    username: Optional[str] = "Sistema",
    record_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
    status: str = "EXITOSO"
):
    """Registra una operación en el log inmutable de auditoría."""
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            module=module,
            record_id=str(record_id) if record_id else None,
            details=details,
            ip_address=ip_address,
            status=status
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"[AUDIT ERROR] No se pudo guardar log de auditoría: {e}")
        db.rollback()
