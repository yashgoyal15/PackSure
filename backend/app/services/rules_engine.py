"""
Applies the SRS's three-state screening logic (Section 7.4) to each
extracted field:

  PASS                     — detected with sufficient confidence and a
                              valid format.
  REVIEW                   — uncertain: either the field wasn't detected
                              but overall image quality was too poor to be
                              sure it's really absent, or it was detected
                              with low confidence.
  POTENTIAL NON-COMPLIANCE — either detected but the value fails a format
                              check, or genuinely absent from an otherwise
                              clearly-readable label.

This mirrors the UI/UX spec's "uncertainty is a first-class state, not an
error" principle: low confidence is never silently promoted to a violation.
"""
from dataclasses import dataclass

from app.services.extraction import FieldMatch
from app.services.ocr import OcrResult

CONFIDENCE_THRESHOLD = 70.0  # below this, a detected field is REVIEW not PASS
IMAGE_QUALITY_THRESHOLD = 65.0  # below this, a MISSING field is REVIEW not NON-COMPLIANT


@dataclass
class RuleOutcome:
    status: str  # "PASS" | "REVIEW" | "POTENTIAL NON-COMPLIANCE"
    confidence: int
    detail: str
    box: dict | None  # pixel box (converted to % by the caller) or None


def _truncate(value: str, length: int = 60) -> str:
    value = value.strip()
    return value if len(value) <= length else value[: length - 1] + "\u2026"


def evaluate_field(rule_id: str, match: FieldMatch, image_mean_confidence: float) -> RuleOutcome:
    if not match.found:
        if image_mean_confidence >= IMAGE_QUALITY_THRESHOLD:
            # NOTE: this used to set confidence=round(image_mean_confidence), which
            # is the *whole image's* mean OCR confidence, not anything specific to
            # this field. Since it's the same number for every image, reusing it
            # here made every missing-field row on a given inspection show an
            # identical "Confidence NN%" that had nothing to do with that field ---
            # confusing, and looked like a bug where every check reported the same
            # score. There genuinely is no field-level confidence for something
            # that wasn't found, so we report 0 and let `detail` carry the
            # explanation instead. The frontend hides the confidence readout when
            # it's 0 (see AnalysisResultView.jsx).
            return RuleOutcome(
                status="POTENTIAL NON-COMPLIANCE",
                confidence=0,
                detail="Required declaration was not detected on the visible label",
                box=None,
            )
        # Here the image quality itself IS the reason for the REVIEW verdict, so
        # showing it is legitimate and useful (unlike the branch above).
        return RuleOutcome(
            status="REVIEW",
            confidence=round(image_mean_confidence),
            detail=f"Image quality too low to reliably detect this field ({round(image_mean_confidence)}% OCR confidence) \u2014 retry or verify manually",
            box=None,
        )

    if not match.valid_format:
        return RuleOutcome(
            status="POTENTIAL NON-COMPLIANCE",
            confidence=round(match.confidence),
            detail=f"Detected value does not match the expected format: \u201c{_truncate(match.value)}\u201d",
            box=match.box,
        )

    if match.confidence < CONFIDENCE_THRESHOLD:
        return RuleOutcome(
            status="REVIEW",
            confidence=round(match.confidence),
            detail=f"Low OCR confidence ({round(match.confidence)}%) \u2014 please verify manually",
            box=match.box,
        )

    return RuleOutcome(
        status="PASS",
        confidence=round(match.confidence),
        detail=f"Detected: \u201c{_truncate(match.value)}\u201d",
        box=match.box,
    )


def evaluate_readability(ocr_result: OcrResult) -> RuleOutcome:
    """
    Estimates text prominence from OCR geometry (median word height relative
    to image height) rather than a physical mm measurement, per the SRS's
    explicit caveat that font-size-in-millimetres cannot be guaranteed from
    an arbitrary photo without a scale reference (Section 3.2 / 17).
    """
    if not ocr_result.words:
        return RuleOutcome(status="REVIEW", confidence=0, detail="No readable text detected on this image", box=None)

    heights = sorted(w.height for w in ocr_result.words)
    median_height = heights[len(heights) // 2]
    ratio = median_height / ocr_result.image_height

    if ocr_result.mean_confidence < 55:
        return RuleOutcome(
            status="REVIEW",
            confidence=round(ocr_result.mean_confidence),
            detail="Image sharpness too low to reliably assess text prominence",
            box=None,
        )
    if ratio < 0.010:
        return RuleOutcome(
            status="REVIEW",
            confidence=round(ocr_result.mean_confidence),
            detail="Text region appears small relative to package size \u2014 verify manually",
            box=None,
        )
    return RuleOutcome(
        status="PASS",
        confidence=round(ocr_result.mean_confidence),
        detail="Text region size within expected range for the image provided",
        box=None,
    )


def box_to_percent(box: dict | None, image_width: int, image_height: int) -> dict | None:
    if not box or not image_width or not image_height:
        return None
    return {
        "x": round(100 * box["left"] / image_width, 2),
        "y": round(100 * box["top"] / image_height, 2),
        "w": round(100 * box["width"] / image_width, 2),
        "h": round(100 * box["height"] / image_height, 2),
    }
