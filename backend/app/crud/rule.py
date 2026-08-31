from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rule import ComplianceRule
from app.schemas.rule import ComplianceRuleCreate


def list_rules(db: Session) -> list[ComplianceRule]:
    return list(db.scalars(select(ComplianceRule).order_by(ComplianceRule.id)).all())


def create_rule(db: Session, payload: ComplianceRuleCreate) -> ComplianceRule:
    rule = ComplianceRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule
