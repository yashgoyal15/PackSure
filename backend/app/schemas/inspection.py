from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field

from app.models.inspection import InspectionStatus


class RuleResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rule_id: str
    status: InspectionStatus
    confidence: int
    detail: str
    box_x: float | None = None
    box_y: float | None = None
    box_w: float | None = None
    box_h: float | None = None


class InspectionImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_name: str | None = None

    @computed_field
    @property
    def url(self) -> str:
        return f"/api/inspections/images/{self.id}"


class InspectorBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class InspectionListItem(BaseModel):
    """Lightweight shape for the Repository table / Dashboard recent list."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_name: str
    category: str | None
    status: InspectionStatus
    score: int
    created_at: datetime
    inspector: InspectorBrief

    @computed_field
    @property
    def code(self) -> str:
        return f"A{self.id:03d}"


class InspectionListResponse(BaseModel):
    items: list[InspectionListItem]
    total: int
    page: int
    page_size: int


class InspectionDetail(BaseModel):
    """Full shape consumed by AnalysisResultView on the frontend."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_name: str
    category: str | None
    package_type: str | None
    status: InspectionStatus
    score: int
    rule_version: str
    created_at: datetime
    analyzed_at: datetime | None
    inspector: InspectorBrief
    images: list[InspectionImageOut]
    rule_results: list[RuleResultOut]

    @computed_field
    @property
    def code(self) -> str:
        return f"A{self.id:03d}"
