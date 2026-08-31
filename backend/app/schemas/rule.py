from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.rule import RuleSeverity, RuleStatus


class ComplianceRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    rule_text: str
    severity: RuleSeverity
    status: RuleStatus
    version: str
    created_at: datetime


class ComplianceRuleCreate(BaseModel):
    category: str
    rule_text: str
    severity: RuleSeverity = RuleSeverity.MEDIUM
    status: RuleStatus = RuleStatus.DRAFT
