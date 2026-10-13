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



