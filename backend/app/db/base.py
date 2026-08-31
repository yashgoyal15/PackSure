from app.db.base_class import Base

# Import models so they register on Base.metadata. Required for both
# `Base.metadata.create_all()` (quick start) and Alembic autogenerate.
# This module must NOT be imported by the model files themselves (that
# would create a circular import) — only by app/main.py and scripts/seed.py.
from app.models.user import User  # noqa: E402,F401
from app.models.rule import ComplianceRule  # noqa: E402,F401
from app.models.inspection import Inspection, InspectionImage  # noqa: E402,F401
from app.models.rule_result import RuleResult  # noqa: E402,F401
