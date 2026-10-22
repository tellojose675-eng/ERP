from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.dashboard_service import get_dashboard_metrics, reset_all_operations
from app.security.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard Ejecutivo"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)

@router.post("/reset-all")
def reset_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return reset_all_operations(
        db=db,
        user_id=current_user.id,
        username=current_user.username
    )
