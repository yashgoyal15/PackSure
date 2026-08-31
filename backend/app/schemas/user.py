from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole, UserStatus


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    initials: str


class UserWithStats(UserOut):
    inspections: int = 0


class UserInvite(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.INSPECTOR
    password: str = "changeme123"  # demo default; real flow would email a set-password link
