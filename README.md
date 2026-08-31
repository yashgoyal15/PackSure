# PackSure — Smart Legal Metrology Compliance System

Full-stack project for **Smart India Hackathon 2026, Problem Statement 26034**: an AI-assisted packaged commodity compliance screening system.

This folder contains two projects that work together:

```
PackSure-fullstack/
├── backend/     # FastAPI + SQLAlchemy API — auth, database, uploads, real OCR pipeline, PDF generation
└── frontend/    # React + Vite + Tailwind UI, fully wired to the backend
```

Both have their own detailed `README.md`. This file just gets you running end-to-end as fast as possible.

---

## Run It (2 terminals)

**Terminal 1 — backend:**
```bash
# System dependency (one-time): the OCR engine itself
sudo apt-get install tesseract-ocr        # macOS: brew install tesseract

cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m scripts.seed
uvicorn app.main:app --reload
```
→ API running at `http://localhost:8000` (interactive docs at `/docs`)

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```
→ App running at `http://localhost:5173`

Open `http://localhost:5173`, click **"Launch Console"**, and use one of the quick-fill demo logins on the login screen (Inspector or Administrator).

**To see the AI pipeline actually work:** run `python backend/scripts/gen_test_labels.py` to generate three synthetic test label images, then upload one through "New Inspection" in the app. See `backend/README.md`'s "OCR & Rule Engine Pipeline" section for what each one demonstrates.

---

## What's Real vs. Simulated

| Piece | Status |
|---|---|
| Auth (JWT, bcrypt, role-based authorization) | **Real** — enforced server-side |
| Database (inspections, users, rules) | **Real** — SQLite by default, one env var away from Postgres |
| Image upload & storage | **Real** — local disk (swappable for S3) |
| **OCR (Tesseract) + image preprocessing (OpenCV)** | **Real** — reads the actual uploaded image |
| **Field extraction & rule engine** | **Real** — regex/keyword extraction of the 9 declaration categories, evaluated into PASS/REVIEW/NON-COMPLIANT with genuine confidence scores and bounding boxes |
| Dashboard/analytics aggregates | **Real** — computed from live DB queries |
| PDF compliance reports | **Real** — generated with ReportLab, not a stub |
| Admin user invite / rule creation | **Real** — writes to the database |

There is no more simulated piece in the core inspection flow — a photo uploaded through the app is genuinely preprocessed, OCR'd, matched against the 9 Legal Metrology declaration categories, and scored, with real evidence bounding boxes drawn on the real image.

**What's still rough / worth tuning before a production or high-stakes demo:**
- The extraction rules (`backend/app/services/extraction.py`) were validated against clean, computer-generated label images, not a large sample of real photographed retail packaging (glare, curved surfaces, tiny print, regional scripts). Expect to spend time tuning against real photos.
- Tesseract is a solid, dependency-light OCR engine but not the strongest available; `backend/README.md` explains the (small, isolated) swap to PaddleOCR if you need higher accuracy on real photos.
- Logout is stateless (no server-side JWT revocation) and there's no audit logging yet — both called out in `backend/README.md`.

---

## Suggested Next Steps

1. **Tune OCR/extraction against real product photos** — take 15–20 real package photos, run them through, and adjust the regex patterns in `extraction.py` and the confidence thresholds in `rules_engine.py` based on what you see.
2. **Deployment** — frontend to Vercel/Netlify (static build), backend + Postgres to Render/Railway. Remember the deployment target needs Tesseract installed (most PaaS providers support an `apt.txt`/buildpack for this).
3. **Demo prep** — once tuned, curate 4–5 real package photos that reliably produce each outcome (PASS, REVIEW, NON-COMPLIANCE) for a live demo that doesn't depend on OCR quality on the day.

See each sub-project's README for full architecture details, API reference, and project structure.
