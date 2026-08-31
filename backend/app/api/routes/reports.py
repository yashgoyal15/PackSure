import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud import inspection as inspection_crud
from app.db.session import get_db
from app.models.inspection import InspectionStatus
from app.models.user import User
from app.services.rule_catalog import RULE_LABELS

router = APIRouter(prefix="/reports", tags=["reports"])

STATUS_COLOR = {
    InspectionStatus.PASS: colors.HexColor("#16a34a"),
    InspectionStatus.REVIEW: colors.HexColor("#d97706"),
    InspectionStatus.NON_COMPLIANT: colors.HexColor("#dc2626"),
}


@router.get("/{inspection_id}/pdf")
def generate_pdf(inspection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """FR-REP-01 to FR-REP-06: generate a self-contained compliance report."""
    inspection = inspection_crud.get_inspection(db, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.status == InspectionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Inspection has not been analyzed yet")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], textColor=colors.HexColor("#1e3a8a"))
    story = []

    story.append(Paragraph("PackSure \u2014 Compliance Screening Report", title_style))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(f"Inspection #{inspection.code} &middot; {inspection.product_name}", styles["Heading2"]))
    story.append(
        Paragraph(
            f"Inspector: {inspection.inspector.name} &middot; "
            f"Analyzed: {inspection.analyzed_at.strftime('%d %b %Y, %H:%M') if inspection.analyzed_at else '-'} &middot; "
            f"Rule set: {inspection.rule_version}",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 6 * mm))

    status_color = STATUS_COLOR.get(inspection.status, colors.grey)
    status_style = ParagraphStyle("Status", parent=styles["Heading1"], textColor=status_color, fontSize=20)
    story.append(Paragraph(f"{inspection.status.value} &mdash; Score {inspection.score}/100", status_style))
    story.append(Spacer(1, 6 * mm))

    cell_style = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=8, leading=10)
    header_style = ParagraphStyle("CellHeader", parent=styles["Normal"], fontSize=8, leading=10, textColor=colors.white)

    table_data = [[Paragraph(h, header_style) for h in ["Declaration", "Status", "Confidence", "Detail"]]]
    for r in inspection.rule_results:
        table_data.append(
            [
                Paragraph(RULE_LABELS.get(r.rule_id, r.rule_id), cell_style),
                Paragraph(r.status.value, cell_style),
                Paragraph(f"{r.confidence}%", cell_style),
                Paragraph(r.detail, cell_style),
            ]
        )

    table = Table(table_data, colWidths=[110, 85, 55, 210])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 8 * mm))

    disclaimer_style = ParagraphStyle("Disclaimer", parent=styles["Normal"], textColor=colors.grey, fontSize=8)
    story.append(
        Paragraph(
            "This is an automated screening result intended to support \u2014 not replace \u2014 manual "
            "regulatory review. Final rule definitions should be verified against the latest official "
            "Legal Metrology (Packaged Commodities) Rules before any enforcement action.",
            disclaimer_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=packsure-report-{inspection.code}.pdf"},
    )
