from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.inspection import Inspection
from app.models.user import User, UserRole


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, *, name: str, email: str, password: str, role: UserRole) -> User:
    user = User(name=name, email=email, password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users_with_counts(db: Session) -> list[tuple[User, int]]:
    rows = db.execute(
        select(User, func.count(Inspection.id))
        .outerjoin(Inspection, Inspection.inspector_id == User.id)
        .group_by(User.id)
        .order_by(User.id)
    ).all()
    return [(u, count) for u, count in rows]
