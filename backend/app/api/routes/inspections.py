from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import inspection as inspection_crud
from app.db.session import get_db
from app.models.inspection import Inspection, InspectionImage, InspectionStatus
from app.models.user import User
from app.schemas.inspection import InspectionDetail, InspectionListResponse
from app.services import storage
from app.services.analysis import finalize_inspection, run_analysis

router = APIRouter(prefix="/inspections", tags=["inspections"])


@router.post("", response_model=InspectionDetail, status_code=status.HTTP_201_CREATED)
def create_inspection(
    product_name: str = Form(...),
    category: str | None = Form(None),
    package_type: str | None = Form(None),
    images: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FR-SCAN-01/02/03: upload one or more package images to start an inspection."""
    if not images:
        raise HTTPException(status_code=400, detail="At least one image is required")

    inspection = inspection_crud.create_inspection(
        db,
        product_name=product_name or "Unidentified Package",
        category=category,
        package_type=package_type,
        inspector_id=current_user.id,
    )

    for upload in images:
        if upload.content_type not in ("image/jpeg", "image/jpg", "image/png"):
            raise HTTPException(status_code=400, detail=f"Unsupported image format: {upload.content_type}")
        path = storage.save_upload(upload, inspection.id)
        db.add(InspectionImage(inspection_id=inspection.id, file_path=path, original_name=upload.filename))

    db.commit()
    return inspection_crud.get_inspection(db, inspection.id)


@router.post("/{inspection_id}/analyze", response_model=InspectionDetail)
def analyze_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FR-OCR-*, FR-EXT-*, FR-RULE-*: run the AI pipeline and persist results."""
    inspection = inspection_crud.get_inspection(db, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    _assert_can_access(inspection, current_user)

    from datetime import datetime, timezone

    results = run_analysis(inspection)
    for r in results:
        db.add(r)
    finalize_inspection(inspection, results)
    inspection.analyzed_at = datetime.now(timezone.utc)

    db.commit()
    return inspection_crud.get_inspection(db, inspection_id)


@router.get("/{inspection_id}", response_model=InspectionDetail)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inspection = inspection_crud.get_inspection(db, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    _assert_can_access(inspection, current_user)
    return inspection


@router.get("", response_model=InspectionListResponse)
def list_inspections(
    q: str | None = None,
    status_filter: InspectionStatus | None = None,
    scope_all: bool = False,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FR-HIS-01/03/04: search, filter and paginate saved inspections."""
    items, total = inspection_crud.list_inspections(
        db,
        current_user=current_user,
        query=q,
        status=status_filter,
        scope_all=scope_all,
        page=page,
        page_size=page_size,
    )
    return InspectionListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    image = db.get(InspectionImage, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    _assert_can_access(image.inspection, current_user)
    return FileResponse(image.file_path)


def _assert_can_access(inspection: Inspection, current_user: User) -> None:
    from app.models.user import UserRole

    if current_user.role != UserRole.ADMINISTRATOR and inspection.inspector_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this inspection")
