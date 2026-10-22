from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, Role
from app.schemas.schemas import UserCreate, UserUpdate, UserOut, RoleOut
from app.security.security import hash_password
from app.security.deps import get_current_user, require_role
from app.services.audit_service import log_activity

router = APIRouter(prefix="/users", tags=["Usuarios y Roles"])

@router.get("/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Administrador"))
):
    return db.query(User).all()

@router.post("/", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Administrador"))
):
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario o correo ya está registrado")
        
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role_id=user_in.role_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_activity(
        db=db,
        action="CREAR",
        module="USUARIOS",
        user_id=current_user.id,
        username=current_user.username,
        record_id=str(user.id),
        details=f"Creación de usuario {user.username}"
    )
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Administrador"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.role_id is not None:
        user.role_id = user_in.role_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = hash_password(user_in.password)
        
    db.commit()
    db.refresh(user)
    return user

@router.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()
