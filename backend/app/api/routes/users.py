from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.crud import user as user_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserInvite, UserOut, UserWithStats

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserWithStats])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = user_crud.list_users_with_counts(db)
    return [UserWithStats(**UserOut.model_validate(u).model_dump(), inspections=count) for u, count in rows]


@router.post("", response_model=UserOut, status_code=201)
def invite_user(payload: UserInvite, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if user_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    user = user_crud.create_user(db, name=payload.name, email=payload.email, password=payload.password, role=payload.role)
    return user
