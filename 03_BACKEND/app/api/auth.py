from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Role
from app.schemas.schemas import LoginRequest, TokenResponse, UserOut
from app.security.security import verify_password, hash_password, create_access_token
from app.security.deps import get_current_user
from app.services.audit_service import log_activity

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        log_activity(
            db=db,
            action="LOGIN_FALLIDO",
            module="AUTH",
            username=login_data.username,
            details="Credenciales incorrectas",
            status="FALLIDO"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario suspendido o inactivo")
        
    role_name = user.role.name if user.role else "Usuario"
    access_token = create_access_token(subject=user.username, role=role_name)
    
    log_activity(
        db=db,
        action="LOGIN",
        module="AUTH",
        user_id=user.id,
        username=user.username,
        details=f"Inicio de sesión exitoso como {role_name}"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": role_name
        }
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
