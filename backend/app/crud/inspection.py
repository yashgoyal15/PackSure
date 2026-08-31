from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.inspection import Inspection, InspectionStatus
from app.models.rule_result import RuleResult
from app.models.user import User, UserRole


def create_inspection(
    db: Session, *, product_name: str, category: str | None, package_type: str | None, inspector_id: int
) -> Inspection:
    inspection = Inspection(
        product_name=product_name,
        category=category,
        package_type=package_type,
        inspector_id=inspector_id,
        status=InspectionStatus.PENDING,
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection


def get_inspection(db: Session, inspection_id: int) -> Inspection | None:
    return db.scalar(
        select(Inspection)
        .options(selectinload(Inspection.images), selectinload(Inspection.rule_results), selectinload(Inspection.inspector))
        .where(Inspection.id == inspection_id)
    )


def list_inspections(
    db: Session,
    *,
    current_user: User,
    query: str | None = None,
    status: InspectionStatus | None = None,
    scope_all: bool = False,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Inspection], int]:
    stmt = select(Inspection).options(selectinload(Inspection.inspector))

    # Inspectors only ever see their own inspections. Administrators can
    # request `scope_all=True` to see everyone's (SRS Section 4.1).
    if current_user.role != UserRole.ADMINISTRATOR or not scope_all:
        stmt = stmt.where(Inspection.inspector_id == current_user.id)

    if query:
        like = f"%{query}%"
        stmt = stmt.where(or_(Inspection.product_name.ilike(like)))
    if status:
        stmt = stmt.where(Inspection.status == status)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    stmt = stmt.order_by(Inspection.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = list(db.scalars(stmt).all())
    return items, total or 0


def dashboard_stats(db: Session, *, current_user: User, scope_all: bool = False) -> dict:
    stmt = select(Inspection)
    if current_user.role != UserRole.ADMINISTRATOR or not scope_all:
        stmt = stmt.where(Inspection.inspector_id == current_user.id)
    stmt = stmt.where(Inspection.status != InspectionStatus.PENDING)

    inspections = list(db.scalars(stmt).all())
    total = len(inspections)
    passed = sum(1 for i in inspections if i.status == InspectionStatus.PASS)
    review = sum(1 for i in inspections if i.status == InspectionStatus.REVIEW)
    non_compliant = sum(1 for i in inspections if i.status == InspectionStatus.NON_COMPLIANT)

    # 7-day trend
    today = datetime.now(timezone.utc).date()
    trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_items = [x for x in inspections if x.created_at.date() == day]
        trend.append(
            {
                "day": day.strftime("%a"),
                "pass": sum(1 for x in day_items if x.status == InspectionStatus.PASS),
                "review": sum(1 for x in day_items if x.status == InspectionStatus.REVIEW),
                "nonCompliant": sum(1 for x in day_items if x.status == InspectionStatus.NON_COMPLIANT),
            }
        )

    # Violation categories: which rule_ids most often show up as non-PASS
    violation_counts: dict[str, int] = {}
    flagged_total = 0
    for insp in inspections:
        for r in insp.rule_results:
            if r.status != InspectionStatus.PASS:
                violation_counts[r.rule_id] = violation_counts.get(r.rule_id, 0) + 1
                flagged_total += 1

    top_violations = sorted(violation_counts.items(), key=lambda kv: kv[1], reverse=True)[:4]
    from app.services.rule_catalog import RULE_LABELS

    violation_categories = [
        {
            "label": RULE_LABELS.get(rule_id, rule_id),
            "pct": round((count / flagged_total) * 100) if flagged_total else 0,
        }
        for rule_id, count in top_violations
    ]

    return {
        "total": total,
        "pass": passed,
        "review": review,
        "nonCompliant": non_compliant,
        "trend": trend,
        "violationCategories": violation_categories,
    }
