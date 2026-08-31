import enum
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Enum, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class InspectionStatus(str, enum.Enum):
    PENDING = "PENDING"  # images uploaded, not yet analyzed
    PASS = "PASS"
    REVIEW = "REVIEW"
    NON_COMPLIANT = "POTENTIAL NON-COMPLIANCE"


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    package_type: Mapped[str | None] = mapped_column(String(60), nullable=True)

    inspector_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    inspector: Mapped["User"] = relationship(back_populates="inspections")  # noqa: F821

    status: Mapped[InspectionStatus] = mapped_column(Enum(InspectionStatus), default=InspectionStatus.PENDING)
    score: Mapped[int] = mapped_column(Integer, default=0)
    rule_version: Mapped[str] = mapped_column(String(20), default="v1.0")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    images: Mapped[list["InspectionImage"]] = relationship(
        back_populates="inspection", cascade="all, delete-orphan"
    )
    rule_results: Mapped[list["RuleResult"]] = relationship(  # noqa: F821
        back_populates="inspection", cascade="all, delete-orphan"
    )

    @property
    def code(self) -> str:
        """Human-friendly ID shown in the UI, e.g. 'A214'."""
        return f"A{self.id:03d}"


class InspectionImage(Base):
    __tablename__ = "inspection_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey("inspections.id"))
    inspection: Mapped["Inspection"] = relationship(back_populates="images")

    file_path: Mapped[str] = mapped_column(String(400))
    original_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
