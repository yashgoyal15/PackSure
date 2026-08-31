from sqlalchemy import String, Integer, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.inspection import InspectionStatus
from sqlalchemy import Enum as SAEnum


class RuleResult(Base):
    """
    One row per declaration field checked for a given inspection, e.g.
    'mrp' -> REVIEW, confidence 54%, 'Value partially obscured...'.
    Mirrors the frontend's `inspection.rules[]` shape exactly.
    """

    __tablename__ = "rule_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey("inspections.id"))
    inspection: Mapped["Inspection"] = relationship(back_populates="rule_results")  # noqa: F821

    rule_id: Mapped[str] = mapped_column(String(60))  # e.g. "mrp", "net_quantity"
    status: Mapped[InspectionStatus] = mapped_column(SAEnum(InspectionStatus))
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    detail: Mapped[str] = mapped_column(Text)

    # Optional OCR bounding box, as a percentage of image width/height
    # (matches the frontend's evidence-overlay coordinate system).
    box_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    box_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    box_w: Mapped[float | None] = mapped_column(Float, nullable=True)
    box_h: Mapped[float | None] = mapped_column(Float, nullable=True)
