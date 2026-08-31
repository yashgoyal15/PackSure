from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.crud import rule as rule_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.rule import ComplianceRuleCreate, ComplianceRuleOut

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("", response_model=list[ComplianceRuleOut])
def list_rules(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return rule_crud.list_rules(db)


@router.post("", response_model=ComplianceRuleOut, status_code=201)
def create_rule(payload: ComplianceRuleCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return rule_crud.create_rule(db, payload)
