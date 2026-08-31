"""
Entry point for the AI analysis pipeline.

    image(s) -> OpenCV preprocessing -> Tesseract OCR (text + boxes + confidence)
             -> field extraction (regex/keyword matching, extraction.py)
             -> rule evaluation (rules_engine.py)
             -> RuleResult rows + overall score/status

This is the real pipeline (not a stub) — see README "OCR Pipeline" section
for accuracy notes and how to swap in a stronger OCR engine (e.g. PaddleOCR)
later without touching any other part of the codebase, since everything
downstream only depends on the `RuleResult` shape produced here.
"""
from app.models.inspection import Inspection, InspectionStatus
from app.models.rule_result import RuleResult
from app.services import extraction, ocr
from app.services.rule_catalog import RULE_CATALOG
from app.services.rules_engine import box_to_percent, evaluate_field, evaluate_readability

CURRENT_RULE_VERSION = "v1.0-ocr"

_STATUS_MAP = {
    "PASS": InspectionStatus.PASS,
    "REVIEW": InspectionStatus.REVIEW,
    "POTENTIAL NON-COMPLIANCE": InspectionStatus.NON_COMPLIANT,
}


def run_analysis(inspection: Inspection) -> list[RuleResult]:
    """
    Run OCR + field extraction + rule evaluation across every image attached
    to this inspection, and return a list of unsaved RuleResult objects (one
    per category in RULE_CATALOG). The caller persists them and calls
    `finalize_inspection()` to roll them up into an overall score/status.
    """
    image_paths = [img.file_path for img in inspection.images]

    if not image_paths:
        # Defensive fallback — the API layer requires at least one image,
        # but this keeps the pipeline safe if it's ever called without one.
        return [
            RuleResult(
                inspection_id=inspection.id,
                rule_id=rule["id"],
                status=InspectionStatus.REVIEW,
                confidence=0,
                detail="No image was available to analyze",
            )
            for rule in RULE_CATALOG
        ]

    ocr_results = []
    for path in image_paths:
        try:
            ocr_results.append(ocr.run_ocr(path))
        except Exception:
            continue  # a single unreadable file shouldn't crash the whole inspection

    if not ocr_results:
        return [
            RuleResult(
                inspection_id=inspection.id,
                rule_id=rule["id"],
                status=InspectionStatus.REVIEW,
                confidence=0,
                detail="The image could not be processed \u2014 retry with a clearer photo",
            )
            for rule in RULE_CATALOG
        ]

    primary = ocr_results[0]  # evidence bounding boxes are drawn against the first image
    overall_confidence = sum(r.mean_confidence for r in ocr_results) / len(ocr_results)

    # Extract fields from every image and keep the best (highest-confidence)
    # match per field, so a declaration on a second/back-label photo is
    # still found even if it's not on the first image.
    best_matches: dict[str, extraction.FieldMatch] = {}
    for idx, result in enumerate(ocr_results):
        for rule_id, match in extraction.extract_all_fields(result).items():
            if not match.found:
                continue
            current = best_matches.get(rule_id)
            if current is None or match.confidence > current.confidence:
                # Only attach a box if this match came from the primary (first) image.
                best_matches[rule_id] = match if idx == 0 else FieldMatchNoBox(match)

    results: list[RuleResult] = []
    for rule in RULE_CATALOG:
        rule_id = rule["id"]

        if rule_id == "readability":
            outcome = evaluate_readability(primary)
        else:
            match = best_matches.get(rule_id, extraction.FieldMatch(found=False))
            outcome = evaluate_field(rule_id, match, overall_confidence)

        box_pct = box_to_percent(outcome.box, primary.image_width, primary.image_height)
        results.append(
            RuleResult(
                inspection_id=inspection.id,
                rule_id=rule_id,
                status=_STATUS_MAP[outcome.status],
                confidence=outcome.confidence,
                detail=outcome.detail,
                box_x=box_pct["x"] if box_pct else None,
                box_y=box_pct["y"] if box_pct else None,
                box_w=box_pct["w"] if box_pct else None,
                box_h=box_pct["h"] if box_pct else None,
            )
        )

    return results


def FieldMatchNoBox(match: extraction.FieldMatch) -> extraction.FieldMatch:
    """Returns a copy of `match` with its box cleared (used for matches found
    on a non-primary image, since evidence overlays only draw on the first)."""
    return extraction.FieldMatch(found=match.found, value=match.value, confidence=match.confidence, box=None, valid_format=match.valid_format)


def finalize_inspection(inspection: Inspection, results: list[RuleResult]) -> None:
    """Compute overall score/status from individual rule results (SRS 7.2/7.4)."""
    total = len(results) or 1
    passed = sum(1 for r in results if r.status == InspectionStatus.PASS)
    reviewed = [r for r in results if r.status == InspectionStatus.REVIEW]
    non_compliant = sum(1 for r in results if r.status == InspectionStatus.NON_COMPLIANT)

    # Previously every REVIEW row contributed a flat 55 points regardless of
    # *why* it was REVIEW. When OCR quality is borderline, most rows end up as
    # REVIEW, and averaging a constant across them makes the overall score
    # converge to ~55 for almost every inspection, no matter how good or bad
    # the actual label is \u2014 the score stops carrying information.
    # Instead, weight each REVIEW row by its own OCR confidence (already
    # computed per-row in rules_engine.py), so a REVIEW at 68% confidence
    # scores higher than one at 40%, and the overall score actually reflects
    # the image in front of it.
    review_points = sum(30 + 0.5 * r.confidence for r in reviewed)  # 30-80 pt range

    inspection.score = round((passed * 100 + review_points) / total)
    if non_compliant > 0:
        inspection.status = InspectionStatus.NON_COMPLIANT
    elif reviewed:
        # `reviewed` is the list of REVIEW rows itself (not a count) — comparing
        # a list to an int here used to raise a TypeError on every inspection
        # that had at least one REVIEW row and zero NON_COMPLIANT rows. That's
        # the common case for real (photographed, not scanned) label images,
        # since borderline OCR confidence lands fields in REVIEW rather than
        # an outright PASS/FAIL. The crash surfaced to the user as a generic
        # "Something went wrong while analyzing the image" error.
        inspection.status = InspectionStatus.REVIEW
    else:
        inspection.status = InspectionStatus.PASS
    inspection.rule_version = CURRENT_RULE_VERSION
