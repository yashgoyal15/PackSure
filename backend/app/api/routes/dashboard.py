from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import inspection as inspection_crud
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(scope_all: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """FR-DASH-01 to FR-DASH-05: KPIs, trend, and violation categories."""
    return inspection_crud.dashboard_stats(db, current_user=current_user, scope_all=scope_all)
