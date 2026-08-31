import enum
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class RuleSeverity(str, enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class RuleStatus(str, enum.Enum):
    ACTIVE = "Active"
    DRAFT = "Draft"


class ComplianceRule(Base):
    """
    A single configurable compliance check, e.g. "MRP must be prefixed with
    a currency symbol". Kept separate from application code per the SRS
    ('rules shall be stored/configured separately from UI logic').
    """

    __tablename__ = "compliance_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(80))
    rule_text: Mapped[str] = mapped_column(Text)
    severity: Mapped[RuleSeverity] = mapped_column(Enum(RuleSeverity), default=RuleSeverity.MEDIUM)
    status: Mapped[RuleStatus] = mapped_column(Enum(RuleStatus), default=RuleStatus.ACTIVE)
    version: Mapped[str] = mapped_column(String(20), default="v1.0")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
