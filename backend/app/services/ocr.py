"""
Image preprocessing (OpenCV) + text/bounding-box extraction (Tesseract),
per the SRS architecture: image -> preprocessing -> OCR -> field extraction.

This module only knows about pixels and words; it has no idea what a
"declaration" or a "rule" is. That logic lives in `extraction.py` and
`rules_engine.py`, one layer up.
"""
from dataclasses import dataclass
import re

import cv2
import numpy as np
import pytesseract

_HAS_ALNUM_RE = re.compile(r"[a-zA-Z0-9]")


@dataclass
class OcrWord:
    text: str
    confidence: float  # 0-100
    left: int
    top: int
    width: int
    height: int
    line_id: tuple  # (block, paragraph, line) — words with the same id are on the same line


@dataclass
class OcrResult:
    words: list[OcrWord]
    image_width: int
    image_height: int

    @property
    def full_text(self) -> str:
        return " ".join(w.text for w in self.words)

    @property
    def mean_confidence(self) -> float:
        if not self.words:
            return 0.0
        return sum(w.confidence for w in self.words) / len(self.words)

    def lines(self) -> list[list[OcrWord]]:
        """
        Group words back into their original text lines, in reading order.

        Tesseract's block/paragraph/line grouping assumes a single reading
        column. Real product labels routinely print two columns side by side
        at the same vertical position (e.g. net-weight/batch/MFG-date on the
        left, ingredients on the right) — under `--psm 6` (uniform block of
        text) Tesseract regularly reads straight across both columns and
        reports them as one `line_num`. Left uncorrected, that merges two
        unrelated declarations into a single OCR "line": the field-matching
        regexes in extraction.py then pick up stray text from the other
        column, and the evidence bounding box (`_line_box`, a min/max over
        every word in the line) stretches across both columns instead of
        hugging just the matched field. That's the direct cause of the
        distorted/oversized bounding boxes seen on real photographed labels.

        Fix: after grouping by Tesseract's own line id, split each group
        further wherever the horizontal gap between consecutive words is far
        wider than normal word spacing — a strong signal of a column break
        rather than a space character. Ordinary word/punctuation spacing
        (even a wide one, e.g. before "(incl. of all taxes)") stays well
        under this threshold on every label we've tested; only genuine
        column gutters trip it.
        """
        grouped: dict[tuple, list[OcrWord]] = {}
        for w in self.words:
            grouped.setdefault(w.line_id, []).append(w)

        lines: list[list[OcrWord]] = []
        for key in sorted(grouped.keys()):
            words = sorted(grouped[key], key=lambda w: w.left)
            current = [words[0]]
            for prev, word in zip(words, words[1:]):
                gap = word.left - (prev.left + prev.width)
                gap_threshold = max(2.2 * max(prev.height, word.height), 0.05 * self.image_width)
                if gap > gap_threshold:
                    lines.append(current)
                    current = [word]
                else:
                    current.append(word)
            lines.append(current)
        return lines


def _base_grayscale(image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale small images — OCR accuracy drops sharply below ~150 DPI-equivalent.
    # Raised the floor from 1000px to 1600px: real photographed labels (as
    # opposed to flat scans) are usually captured at a distance, so the
    # printed text ends up small in the frame even when the overall photo
    # resolution is decent. 1000px was leaving fine print (fine-print MRP
    # notes, batch numbers) too small in pixels for Tesseract to read
    # reliably, which is a direct cause of the garbled/misspelled output.
    h, w = gray.shape
    if max(h, w) < 1600:
        scale = 1600 / max(h, w)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    return gray


def preprocess(image_path: str) -> np.ndarray:
    """
    Grayscale, denoise, adaptive threshold, and a mild upscale for small
    package-label photos — this is the step the SRS calls out as "Image
    Preprocessing" in the pipeline diagram (Section 19.1).

    Hard binarization (adaptiveThreshold) is great for flat, evenly-lit scans
    but is too aggressive for real product photos: glossy packaging,
    coloured backgrounds, and uneven lighting regularly get thresholded into
    solid black/white blobs, wiping out text that a human can read fine.
    That was silently tanking OCR confidence (and therefore silently tanking
    detection of otherwise clearly-printed declarations) on exactly the kind
    of photos this app is meant to handle.
    """
    gray = _base_grayscale(image_path)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
    )
    return thresh


def preprocess_soft(image_path: str) -> np.ndarray:
    """
    A gentler alternative to `preprocess()`: denoise + local contrast
    enhancement (CLAHE), but no hard binarization. Keeps grayscale
    gradients intact, which Tesseract's LSTM engine generally handles better
    than a photo that's been thresholded into pure black/white.
    """
    gray = _base_grayscale(image_path)
    denoised = cv2.fastNlMeansDenoising(gray, h=7)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(denoised)


def _ocr_pass(processed: np.ndarray, psm: int = 6) -> OcrResult:
    h, w = processed.shape[:2]
    data = pytesseract.image_to_data(
        processed, output_type=pytesseract.Output.DICT, config=f"--psm {psm}"
    )

    words = []
    for i in range(len(data["text"])):
        text = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not text or conf < 0:  # tesseract uses -1 for non-text regions
            continue
        if not _HAS_ALNUM_RE.search(text):
            # Pure punctuation/symbol "words" (stray '|', '\\', '~', ':'...)
            # are almost always misreads of glare, packaging seams, or
            # background clutter rather than real label content. They carry
            # no extraction value but do dilute mean_confidence and can get
            # grouped into a real line's bounding box — drop them at the
            # source instead of letting every downstream step work around
            # them individually.
            continue
        words.append(
            OcrWord(
                text=text,
                confidence=conf,
                left=data["left"][i],
                top=data["top"][i],
                width=data["width"][i],
                height=data["height"][i],
                line_id=(data["block_num"][i], data["par_num"][i], data["line_num"][i]),
            )
        )

    return OcrResult(words=words, image_width=w, image_height=h)


def run_ocr(image_path: str) -> OcrResult:
    """
    Run Tesseract against a few preprocessing/PSM combinations and keep
    whichever produced the highest-confidence, most complete output:

      - hard-threshold, --psm 6 (uniform block of text; good for clean scans)
      - soft/CLAHE,      --psm 6
      - soft/CLAHE,      --psm 11 (sparse text; handles labels where a
                                    barcode, logo, or graphic breaks up the
                                    text into a layout PSM 6 mis-segments —
                                    exactly the "barcode next to fine print"
                                    layout common on real product labels)

    This costs extra OCR passes but meaningfully improves recall/accuracy on
    photographed (not scanned) labels, where the "right" preprocessing and
    segmentation mode depends on lighting, gloss, and layout and can't be
    predicted up front.
    """
    candidates = [
        _ocr_pass(preprocess(image_path), psm=6),
        _ocr_pass(preprocess_soft(image_path), psm=6),
        _ocr_pass(preprocess_soft(image_path), psm=11),
    ]

    def _score(r: OcrResult) -> float:
        # Favor whichever pass both read *more* text and read it *more
        # confidently — a pass that recognizes only a few high-confidence
        # words isn't actually better than one that read the whole label.
        return r.mean_confidence * (len(r.words) ** 0.5)

    return max(candidates, key=_score)
