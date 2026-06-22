"""Auth API — user verification and management."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    name: str = ""
    role: str = "Operator"
    firebase_uid: str = ""


class UserUpdate(BaseModel):
    name: str = None
    role: str = None
    department: str = None


@router.post("/login")
def login_or_create(request: LoginRequest, db: Session = Depends(get_db)):
    """Login or create user. Called after Firebase auth on frontend."""
    user = db.query(User).filter_by(email=request.email).first()

    if user:
        user.last_login = datetime.now()
        if request.firebase_uid and not user.firebase_uid:
            user.firebase_uid = request.firebase_uid
        db.commit()
        return {
            "id": user.id, "name": user.name, "email": user.email,
            "role": user.role, "department": user.department,
            "isNew": False,
        }
    else:
        # Create new user
        new_user = User(
            firebase_uid=request.firebase_uid or None,
            name=request.name or request.email.split("@")[0].title(),
            email=request.email,
            role=request.role,
            last_login=datetime.now(),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "id": new_user.id, "name": new_user.name, "email": new_user.email,
            "role": new_user.role, "department": new_user.department,
            "isNew": True,
        }


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Get all users (admin only)."""
    users = db.query(User).all()
    return [
        {
            "id": u.id, "name": u.name, "email": u.email,
            "role": u.role, "department": u.department,
            "lastLogin": u.last_login.isoformat() if u.last_login else None,
        }
        for u in users
    ]
