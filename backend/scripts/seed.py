"""
Seed the database with demo data matching the frontend's `mockData.js`,
so the backend is a true drop-in replacement for the mock layer.

Usage:
    python -m scripts.seed
"""
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.inspection import Inspection, InspectionStatus
from app.models.rule import ComplianceRule, RuleSeverity, RuleStatus
from app.models.rule_result import RuleResult
from app.models.user import User, UserRole, UserStatus
from app.services.rule_catalog import RULE_CATALOG

DEMO_PASSWORD = "password123"

USERS = [
    {"name": "Ramesh Sharma", "email": "r.sharma@dept.gov.in", "role": UserRole.INSPECTOR},
    {"name": "Sunita Verma", "email": "s.verma@dept.gov.in", "role": UserRole.INSPECTOR},
    {"name": "Arjun Iyer", "email": "a.iyer@dept.gov.in", "role": UserRole.INSPECTOR},
    {"name": "Priya Nair", "email": "p.nair@dept.gov.in", "role": UserRole.ADMINISTRATOR},
    {"name": "Vikram Singh", "email": "v.singh@dept.gov.in", "role": UserRole.INSPECTOR, "status": UserStatus.INVITED},
]

INSPECTIONS = [
    {"product": "Basmati Rice, Premium Aged 5kg", "category": "Food & Grocery", "inspector": 0, "days_ago": 0},
    {"product": "Mustard Oil, Kachi Ghani 1L", "category": "Food & Grocery", "inspector": 0, "days_ago": 0},
    {"product": "Detergent Powder 1kg", "category": "Household", "inspector": 1, "days_ago": 1},
    {"product": "Glucose Biscuits 200g", "category": "Food & Grocery", "inspector": 1, "days_ago": 1},
    {"product": "Herbal Toothpaste 100g", "category": "Personal Care", "inspector": 0, "days_ago": 1},
    {"product": "Instant Noodles, Masala 70g", "category": "Food & Grocery", "inspector": 2, "days_ago": 2},
    {"product": "Dark Chocolate Bar 40g", "category": "Food & Grocery", "inspector": 2, "days_ago": 2},
    {"product": "Liquid Hand Wash 250ml", "category": "Personal Care", "inspector": 1, "days_ago": 3},
]

RULES = [
    {"category": "Net Quantity", "rule_text": "Must declare quantity in standard SI unit with numeric pattern", "severity": RuleSeverity.HIGH, "status": RuleStatus.ACTIVE},
    {"category": "MRP", "rule_text": "MRP must be prefixed with currency symbol and be a valid decimal", "severity": RuleSeverity.HIGH, "status": RuleStatus.ACTIVE},
    {"category": "Manufacturer", "rule_text": "Manufacturer / packer / importer name and address required", "severity": RuleSeverity.HIGH, "status": RuleStatus.ACTIVE},
    {"category": "Consumer Care", "rule_text": "Valid phone number or email required for consumer complaints", "severity": RuleSeverity.MEDIUM, "status": RuleStatus.ACTIVE},
    {"category": "Country of Origin", "rule_text": "Country of origin required for imported goods", "severity": RuleSeverity.MEDIUM, "status": RuleStatus.ACTIVE},
    {"category": "Readability", "rule_text": "Minimum text height relative to package face area", "severity": RuleSeverity.LOW, "status": RuleStatus.DRAFT},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already has data — skipping seed. Delete packsure.db to reseed.")
            return

        users = []
        for u in USERS:
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=hash_password(DEMO_PASSWORD),
                role=u["role"],
                status=u.get("status", UserStatus.ACTIVE),
            )
            db.add(user)
            users.append(user)
        db.commit()
        for u in users:
            db.refresh(u)

        for rule in RULES:
            db.add(ComplianceRule(**rule, version="v1.0"))
        db.commit()

        now = datetime.now(timezone.utc)
        for spec in INSPECTIONS:
            inspector = users[spec["inspector"]]
            created = now - timedelta(days=spec["days_ago"], hours=random.randint(0, 8))

            inspection = Inspection(
                product_name=spec["product"],
                category=spec["category"],
                inspector_id=inspector.id,
                status=InspectionStatus.PENDING,
                created_at=created,
            )
            db.add(inspection)
            db.commit()
            db.refresh(inspection)

            results = []
            for rule in RULE_CATALOG:
                roll = random.random()
                if roll > 0.82:
                    status_, confidence, detail = (
                        InspectionStatus.REVIEW,
                        random.randint(40, 65),
                        "Low OCR confidence \u2014 please verify manually",
                    )
                elif roll > 0.93:
                    status_, confidence, detail = (
                        InspectionStatus.NON_COMPLIANT,
                        random.randint(70, 92),
                        "Required declaration missing or invalid pattern",
                    )
                else:
                    status_, confidence, detail = (
                        InspectionStatus.PASS,
                        random.randint(85, 99),
                        "Detected and matches expected format",
                    )
                r = RuleResult(
                    inspection_id=inspection.id, rule_id=rule["id"], status=status_, confidence=confidence, detail=detail
                )
                db.add(r)
                results.append(r)
            db.commit()

            total = len(results)
            passed = sum(1 for r in results if r.status == InspectionStatus.PASS)
            reviewed = sum(1 for r in results if r.status == InspectionStatus.REVIEW)
            nc = sum(1 for r in results if r.status == InspectionStatus.NON_COMPLIANT)
            inspection.score = round((passed * 100 + reviewed * 55) / total)
            inspection.status = (
                InspectionStatus.NON_COMPLIANT if nc else InspectionStatus.REVIEW if reviewed else InspectionStatus.PASS
            )
            inspection.rule_version = "v1.0"
            inspection.analyzed_at = created + timedelta(seconds=8)
            db.commit()

        print(f"Seeded {len(users)} users and {len(INSPECTIONS)} inspections.")
        print(f"Demo login: r.sharma@dept.gov.in / {DEMO_PASSWORD}  (Inspector)")
        print(f"Demo login: p.nair@dept.gov.in / {DEMO_PASSWORD}  (Administrator)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
