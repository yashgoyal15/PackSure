"""
Maps raw OCR output to the 9 declaration categories in `rule_catalog.py`,
via keyword and regex matching against OCR lines. This is deliberately a
set of readable, tunable heuristics rather than an ML model — appropriate
for an MVP rule engine per the SRS ("configurable rule-based compliance
screening"), and easy for a domain expert to adjust without touching the
OCR or scoring code.
"""
import re
from dataclasses import dataclass

from app.services.ocr import OcrResult, OcrWord

NET_QTY_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s*(kgs?|gms?|gr?|grams?|mls?|ml|litres?|ltrs?|l)\b", re.I)
MRP_KEYWORD_RE = re.compile(r"\bm\.?r\.?p\.?\b|price", re.I)
# Indian labels print the currency either before the amount ("Rs. 400.00",
# "₹400") or after it ("400.00 Rs.", "400/-") — the original pattern only
# accepted currency-then-number, so a perfectly valid "400.00 Rs." was being
# flagged as an invalid/unrecognized format. Both orders are now accepted,
# and the number is pulled from whichever branch matched via `mrp_amount()`.
MRP_VALUE_RE = re.compile(
    r"(?:(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?))"
    r"|(?:(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹|/-))",
    re.I,
)
MANUFACTURER_RE = re.compile(r"\b(mfg\.?\s*by|manufactured\s*by|marketed\s*by|packed\s*by|packer)\b", re.I)
ADDRESS_KEYWORD_RE = re.compile(r"\baddress\b", re.I)
PIN_CODE_RE = re.compile(r"\b\d{6}\b")
PHONE_RE = re.compile(r"\b(1800[-\s]?\d{2,3}[-\s]?\d{3,4}|\d{10})\b")
EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[a-z.]{2,}\b", re.I)
CARE_KEYWORD_RE = re.compile(r"customer\s*care|consumer\s*care|\bcontact\b", re.I)
ORIGIN_RE = re.compile(r"country\s*of\s*origin|made\s*in\b", re.I)
MFG_INFO_RE = re.compile(r"mfg\.?\s*date|pkd\.?\s*date|batch\s*no|best\s*before|manufacturing\s*date", re.I)


def mrp_amount(match: re.Match) -> str | None:
    """MRP_VALUE_RE has two alternatives (currency-first vs number-first),
    each with its own capture group — return whichever one actually matched."""
    return match.group(1) or match.group(2)


@dataclass
class FieldMatch:
    found: bool
    value: str | None = None
    confidence: float = 0.0  # mean OCR confidence of the matched words
    box: dict | None = None  # pixel box, converted to % later
    valid_format: bool = True


def _line_text(words: list[OcrWord]) -> str:
    return " ".join(w.text for w in words)


def _line_box(words: list[OcrWord]) -> dict:
    left = min(w.left for w in words)
    top = min(w.top for w in words)
    right = max(w.left + w.width for w in words)
    bottom = max(w.top + w.height for w in words)
    return {"left": left, "top": top, "width": right - left, "height": bottom - top}


def _line_confidence(words: list[OcrWord]) -> float:
    return sum(w.confidence for w in words) / len(words) if words else 0.0


# Keyword patterns that mark the *start* of a different declaration. Used to
# stop multi-line concatenation from swallowing the next field on the label.
_OTHER_FIELD_STARTS = [
    MRP_KEYWORD_RE, MANUFACTURER_RE, ADDRESS_KEYWORD_RE, CARE_KEYWORD_RE,
    ORIGIN_RE, MFG_INFO_RE, NET_QTY_RE,
]


def _looks_like_new_field(text: str, own_pattern: re.Pattern) -> bool:
    return any(p is not own_pattern and p.search(text) for p in _OTHER_FIELD_STARTS)


def _first_match(lines: list[list[OcrWord]], pattern: re.Pattern, join_next: int = 0) -> FieldMatch:
    """
    Find the first line matching `pattern`. Real labels routinely wrap a
    declaration across two or three printed lines (e.g. "Address:" on one
    line, the street/city/PIN on the next) — previously this only ever
    looked at the single OCR line containing the keyword, so anything that
    wrapped was reported as PASS with a truncated value or, worse, missed
    entirely if the keyword itself landed alone on its own line. `join_next`
    lets a field pull in up to N following lines as long as they don't look
    like the start of a *different* declaration.
    """
    for i, words in enumerate(lines):
        text = _line_text(words)
        if not pattern.search(text):
            continue
        combined_words = list(words)
        combined_text = text.strip()
        # Track the bottom edge of what's been joined so far, so we only pull
        # in a line that's genuinely *below* it. `lines()` splits Tesseract's
        # own line groups on wide horizontal gaps to separate side-by-side
        # label columns (see ocr.py) — which means a same-row column
        # fragment (e.g. an ingredients line beside a MFG-date line) can
        # land immediately next in this list, at nearly the same `top`. Without
        # this check, join_next would treat that neighbouring column as a
        # continuation of the current field's value.
        last_bottom = max(w.top + w.height for w in words)
        avg_height = sum(w.height for w in words) / len(words)
        for nxt in lines[i + 1 : i + 1 + join_next]:
            nxt_text = _line_text(nxt).strip()
            if not nxt_text or _looks_like_new_field(nxt_text, pattern):
                break
            nxt_top = min(w.top for w in nxt)
            if nxt_top < last_bottom - 0.4 * avg_height:
                break  # not actually the next line down — likely an adjacent column
            combined_words += nxt
            combined_text += ", " + nxt_text
            last_bottom = max(last_bottom, max(w.top + w.height for w in nxt))
        return FieldMatch(
            found=True,
            value=combined_text,
            confidence=_line_confidence(combined_words),
            box=_line_box(combined_words),
        )
    return FieldMatch(found=False)


_BARCODE_RE = re.compile(r"^[\d\s]{6,}$")  # a line that's basically just barcode digits


def extract_product_name(lines: list[list[OcrWord]]) -> FieldMatch:
    """
    Heuristic: the product name is usually the most prominent (largest-font)
    line of text on the label that isn't itself a barcode number string.

    Previously this just grabbed OCR line 0, on the assumption that the
    product name prints first. That breaks on labels with a brand/shop
    banner above the product name (e.g. "AMBASSADOR SWEET MART" printed
    above "Kaju Katri") — the banner would win even though it's a store
    name, not the product's common name. Picking the tallest text instead
    (a decent proxy for "what's printed biggest on the pack") matches how a
    human would actually identify the product name.

    On a genuinely poor-quality photo (blurry, glare, background clutter),
    Tesseract can also mis-measure a garbled, low-confidence line as tall —
    e.g. a stray OCR artifact from someone's face in a badly-framed photo
    can "win" on height alone even though it isn't text at all. Prefer
    tall lines that also cleared a sanity confidence bar; only fall back to
    height-only ranking if every line on the image is that unreliable (in
    which case the low confidence attached to the result still correctly
    signals "verify manually" downstream).
    """
    if not lines:
        return FieldMatch(found=False)

    candidates = [words for words in lines if not _BARCODE_RE.match(_line_text(words).strip())]
    if not candidates:
        candidates = lines

    confident_candidates = [words for words in candidates if _line_confidence(words) >= 40]
    if confident_candidates:
        candidates = confident_candidates

    def _median_height(words: list[OcrWord]) -> float:
        heights = sorted(w.height for w in words)
        return heights[len(heights) // 2]

    best = max(candidates, key=_median_height)
    return FieldMatch(found=True, value=_line_text(best).strip(), confidence=_line_confidence(best), box=_line_box(best))


def extract_net_quantity(lines: list[list[OcrWord]]) -> FieldMatch:
    for words in lines:
        text = _line_text(words)
        if NET_QTY_RE.search(text):
            return FieldMatch(found=True, value=text.strip(), confidence=_line_confidence(words), box=_line_box(words))
    return FieldMatch(found=False)


def extract_mrp(lines: list[list[OcrWord]]) -> FieldMatch:
    # Prefer a line that has BOTH the MRP keyword and a valid value pattern.
    for words in lines:
        text = _line_text(words)
        if MRP_KEYWORD_RE.search(text):
            m = MRP_VALUE_RE.search(text)
            amount = mrp_amount(m) if m else None
            valid = amount is not None and float(amount) > 0
            return FieldMatch(found=True, value=text.strip(), confidence=_line_confidence(words), box=_line_box(words), valid_format=valid)
    # Fall back to a bare "Rs. 123.00" / "123.00 Rs." pattern even without the word MRP.
    for words in lines:
        text = _line_text(words)
        if MRP_VALUE_RE.search(text):
            return FieldMatch(found=True, value=text.strip(), confidence=_line_confidence(words), box=_line_box(words))
    return FieldMatch(found=False)


def extract_manufacturer(lines: list[list[OcrWord]]) -> FieldMatch:
    return _first_match(lines, MANUFACTURER_RE, join_next=1)


def extract_address(lines: list[list[OcrWord]]) -> FieldMatch:
    # Addresses are the field most likely to wrap (street, then city/state/PIN
    # on the next line), so pull in up to 2 following lines.
    m = _first_match(lines, ADDRESS_KEYWORD_RE, join_next=2)
    if m.found:
        return m
    return _first_match(lines, PIN_CODE_RE)  # fallback: a line with a 6-digit PIN is probably the address


def extract_consumer_care(lines: list[list[OcrWord]]) -> FieldMatch:
    m = _first_match(lines, CARE_KEYWORD_RE)
    if m.found:
        return m
    m = _first_match(lines, EMAIL_RE)
    if m.found:
        return m
    return _first_match(lines, PHONE_RE)


def extract_country_of_origin(lines: list[list[OcrWord]]) -> FieldMatch:
    return _first_match(lines, ORIGIN_RE)


def extract_mfg_info(lines: list[list[OcrWord]]) -> FieldMatch:
    return _first_match(lines, MFG_INFO_RE, join_next=1)


EXTRACTORS = {
    "product_name": extract_product_name,
    "net_quantity": extract_net_quantity,
    "mrp": extract_mrp,
    "manufacturer": extract_manufacturer,
    "address": extract_address,
    "consumer_care": extract_consumer_care,
    "country_of_origin": extract_country_of_origin,
    "mfg_info": extract_mfg_info,
    # "readability" is computed separately in rules_engine.py from OCR
    # geometry (text height vs. image size) rather than pattern matching.
}

# A "match" built entirely from words this low-confidence isn't really a
# reading of the label — it's Tesseract's best guess at noise (background
# clutter, glare, a crumpled/tilted photo). The regex fallbacks in
# extract_address/extract_mrp in particular (a bare 6-digit number, a bare
# "123 Rs.") are loose enough to occasionally match garbled OCR output by
# coincidence. Reporting that as a "detected" declaration is worse than
# reporting nothing: it looks like a confirmed reading to the inspector when
# it's actually meaningless text, and it hides the fact that the field is
# genuinely unread. Below this floor, treat the field as not found instead
# — evaluate_field() then correctly routes it to REVIEW/NON-COMPLIANCE based
# on overall image quality rather than showing bogus extracted text.
MIN_ACCEPTABLE_MATCH_CONFIDENCE = 25.0


def extract_all_fields(ocr_result: OcrResult) -> dict[str, FieldMatch]:
    lines = ocr_result.lines()
    matches = {rule_id: extractor(lines) for rule_id, extractor in EXTRACTORS.items()}
    for rule_id, match in matches.items():
        if match.found and match.confidence < MIN_ACCEPTABLE_MATCH_CONFIDENCE:
            matches[rule_id] = FieldMatch(found=False)
    return matches
