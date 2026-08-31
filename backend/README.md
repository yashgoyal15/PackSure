# PackSure API

FastAPI backend for **PackSure — Smart Legal Metrology Compliance System** (Smart India Hackathon 2026, PS 26034).

This is a real, working backend — auth, database, file uploads, a genuine OCR + rule-engine analysis pipeline, and a PDF generator all function end-to-end against real uploaded images. See "OCR & Rule Engine Pipeline" below for how it works and its current accuracy/limitations.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite by default (zero setup) — swap to Postgres via one env var |
| Auth | JWT (PyJWT) + bcrypt password hashing |
| Image processing | OpenCV (preprocessing) |
| OCR | Tesseract (via `pytesseract`) |
| PDF reports | ReportLab |
| Validation | Pydantic v2 |

**System dependency:** this project needs the Tesseract OCR engine installed on the machine (not just the Python package). On Debian/Ubuntu:
```bash
sudo apt-get install tesseract-ocr
```
On macOS: `brew install tesseract`. On Windows, see the [Tesseract install docs](https://github.com/tesseract-ocr/tesseract). Verify with `tesseract --version`.

---

## Getting Started

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # optional — defaults work out of the box

python -m scripts.seed           # creates packsure.db with demo users + inspections
uvicorn app.main:app --reload    # http://localhost:8000
```

Open **http://localhost:8000/docs** for interactive Swagger API docs.

### Demo logins (created by the seed script)

| Email | Password | Role |
|---|---|---|
| `r.sharma@dept.gov.in` | `password123` | Inspector |
| `s.verma@dept.gov.in` | `password123` | Inspector |
| `a.iyer@dept.gov.in` | `password123` | Inspector |
| `p.nair@dept.gov.in` | `password123` | Administrator |

---

## Connecting the Frontend

The `packsure` frontend currently reads from `src/data/mockData.js`. To point it at this API instead:

1. Start this backend on `http://localhost:8000` (CORS is already configured for `http://localhost:5173`).
2. In the frontend, replace `AppContext.login()` with a real `fetch('/api/auth/login', ...)` call and store the returned `access_token`.
3. Replace reads from `mockData.js` with `fetch` calls to the endpoints below, attaching `Authorization: Bearer <token>` to every request.
4. The response shapes were designed to match the frontend's existing data shapes as closely as possible — `InspectionDetail` matches what `AnalysisResultView.jsx` expects almost field-for-field.

---

## API Reference

All endpoints are prefixed with `/api`. Every endpoint except `/auth/login` requires an `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | `{email, password}` → `{access_token, user}` |
| POST | `/auth/logout` | Stateless no-op (see note below) |
| GET | `/auth/me` | Current user |

### Inspections
| Method | Path | Description |
|---|---|---|
| POST | `/inspections` | Multipart form: `product_name`, `category`, `package_type`, `images[]` → creates a `PENDING` inspection |
| POST | `/inspections/{id}/analyze` | Runs the (currently stubbed) AI pipeline, persists rule results, computes score/status |
| GET | `/inspections/{id}` | Full detail (images, rule-wise results) |
| GET | `/inspections` | List/search — query params: `q`, `status_filter`, `scope_all` (admin), `page`, `page_size` |
| GET | `/inspections/images/{image_id}` | Raw image file (for the evidence panel) |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | KPIs, 7-day trend, top violation categories. `?scope_all=true` for admin org-wide view |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/reports/{id}/pdf` | Streams a generated PDF compliance report |

### Admin only (`Administrator` role required — enforced server-side, 403 otherwise)
| Method | Path | Description |
|---|---|---|
| GET | `/users` | List users with inspection counts |
| POST | `/users` | Invite a new user |
| GET | `/rules` | List compliance rules |
| POST | `/rules` | Create a compliance rule |

---

## Project Structure

```
app/
├── main.py                 # App entrypoint, router registration, CORS, startup table creation
├── core/
│   ├── config.py            # Settings (env-driven)
│   └── security.py          # Password hashing, JWT
├── db/
│   ├── base_class.py        # Bare `Base` — imported by every model (no circular imports)
│   ├── base.py               # Imports all models to populate Base.metadata (used by main.py, seed)
│   └── session.py            # Engine, SessionLocal, get_db dependency
├── models/                   # SQLAlchemy ORM models
├── schemas/                  # Pydantic request/response shapes
├── crud/                     # DB query functions, kept separate from route handlers
├── api/
│   ├── deps.py                # get_current_user, require_admin
│   └── routes/                # One router module per resource
└── services/
    ├── ocr.py                  # OpenCV preprocessing + Tesseract text/box/confidence extraction
    ├── extraction.py           # Regex/keyword field extraction -> the 9 declaration categories
    ├── rules_engine.py         # Turns extracted fields into PASS/REVIEW/NON-COMPLIANT + confidence
    ├── analysis.py             # Pipeline orchestrator: ties ocr -> extraction -> rules_engine together
    ├── storage.py              # Local-disk image storage (swap for S3 in production)
    └── rule_catalog.py         # The 9 declaration categories, shared with the frontend's list

scripts/seed.py               # Populates demo data matching the frontend's mockData.js
```

---

## OCR & Rule Engine Pipeline

This is a real pipeline, not a stub — it reads the actual uploaded image and reasons over actual detected text:

```
image(s) --[ocr.py: OpenCV preprocess]--> [ocr.py: Tesseract OCR]
         --> words with text + confidence + pixel bounding box
         --[extraction.py: regex/keyword matching]--> one FieldMatch per declaration category
         --[rules_engine.py: evaluate_field / evaluate_readability]--> PASS / REVIEW / NON-COMPLIANT
```

**Preprocessing** (`ocr.py`): grayscale → upscale small images → denoise → adaptive threshold, then Tesseract's `image_to_data` for word-level text, confidence, and bounding boxes, grouped back into lines.

**Field extraction** (`extraction.py`): each of the 9 categories has a small, readable regex/keyword rule — e.g. `net_quantity` looks for a number + unit (`5 kg`, `250 ml`), `mrp` looks for the MRP keyword plus a `Rs./₹` value, `consumer_care` looks for a phone/toll-free pattern or an email. `product_name` uses the heuristic that the first line on a label is almost always the product name. These are intentionally simple and easy for a non-ML-engineer to tune — see the regex constants at the top of the file.

**Rule evaluation** (`rules_engine.py`) implements the SRS's three-state logic (Section 7.4) with one important nuance: **a missing field is only marked NON-COMPLIANT if the rest of the image OCR'd with reasonably high confidence.** If overall image quality is poor, a missing field becomes REVIEW instead — this is the "uncertainty is never silently promoted to a violation" principle from the UI/UX spec, verified against a deliberately blurry test image (see below).

### Accuracy notes & tuning

- Tuned and validated against clean, computer-generated label images (see `Testing the Pipeline` below) — accuracy on real photographed labels (glare, curved surfaces, small print, non-Latin scripts) will be lower and is the natural next tuning target.
- `CONFIDENCE_THRESHOLD` (default 70) and `IMAGE_QUALITY_THRESHOLD` (default 65) in `rules_engine.py` are the two easiest knobs to adjust based on real-world testing.
- For meaningfully better accuracy on real photos, the straightforward upgrade path is swapping Tesseract for **PaddleOCR** (the engine named in the SRS's architecture diagram) — only `ocr.py` would need to change, since `extraction.py` and `rules_engine.py` operate on the same `OcrWord`/`OcrResult` shapes regardless of which engine produced them.
- Multi-language labels: Tesseract supports other languages via `pytesseract.image_to_data(..., lang="hin+eng")` (requires `tesseract-ocr-hin` etc. installed) — not currently wired up but a small change to `ocr.py`.

### Testing the pipeline

```bash
python scripts/gen_test_labels.py
```

generates three synthetic label images in `test_images/` that deterministically exercise all three outcomes:
- `good_label.jpg` — every declaration present and clear → mostly PASS
- `noncompliant_label.jpg` — MRP/manufacturer/address missing entirely → those fields correctly NON-COMPLIANT, everything else PASS
- `blurry_label.jpg` — a blurred/noisy version of a clean label → everything correctly downgraded to REVIEW rather than false NON-COMPLIANT

Upload any of these through the app's "New Inspection" screen (or via `POST /inspections` + `/analyze`) to see the pipeline run against a real, known-good test case.

---

## Moving to Postgres

```bash
pip install psycopg2-binary
# in .env:
DATABASE_URL=postgresql+psycopg2://packsure:packsure@localhost:5432/packsure
```

For production, replace the `Base.metadata.create_all()` call in `main.py`'s startup event with proper Alembic migrations:

```bash
pip install alembic
alembic init alembic
# point alembic/env.py's target_metadata at app.db.base.Base.metadata
alembic revision --autogenerate -m "init"
alembic upgrade head
```

---

## Known Simplifications (by design, for a hackathon-speed MVP)

- **Logout is stateless.** JWTs aren't revoked server-side; for real token revocation, add a denylist (e.g. Redis, keyed by a `jti` claim).
- **Image storage is local disk.** Swap `app/services/storage.py` for an S3/GCS client for production/multi-instance deployments.
- **OCR accuracy on real photos is untuned.** The pipeline is real and end-to-end, but the regex/keyword extraction rules were validated against clean synthetic labels, not a large set of real photographed Indian retail packaging — expect to spend time tuning `extraction.py` against real sample images before a production/demo deployment.
- **No rate limiting / audit logging yet** — the SRS calls for basic audit trails on logins and admin rule changes; add a middleware or DB trigger for this before production use.
