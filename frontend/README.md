# PackSure — Smart Legal Metrology Compliance System

AI-assisted packaged commodity compliance screening system, built for **Smart India Hackathon 2026, Problem Statement 26034**.

PackSure screens packaged commodity labels against the Legal Metrology (Packaged Commodities) Rules, 2011 using OCR + a configurable rule engine, and returns an explainable **PASS / REVIEW / POTENTIAL NON-COMPLIANCE** result with evidence, in seconds.

This is the **frontend**, fully wired to the companion **PackSure API** (FastAPI + SQLite/Postgres, in the sibling `packsure-backend` project). Every screen — landing page → login → scan → AI analysis → review → save → repository → PDF report → admin — talks to a real backend: real auth, a real database, real file uploads, and a real generated PDF.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 (CSS-based `@theme` config, no `tailwind.config.js` needed) |
| Routing | React Router v7 |
| Charts | Recharts |
| Icons | lucide-react |
| State | React Context + a small `fetch`-based API client (no external data-fetching library) |

---

## Getting Started

**This app needs the backend running first.** See `packsure-backend/README.md`, or the short version:

```bash
# in packsure-backend/
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.seed
uvicorn app.main:app --reload    # http://localhost:8000
```

Then, in this project:

```bash
npm install
cp .env.example .env             # optional — defaults to http://localhost:8000/api
npm run dev                      # http://localhost:5173
```

```bash
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```

**Demo logins** (seeded by the backend):

| Email | Password | Role |
|---|---|---|
| `r.sharma@dept.gov.in` | `password123` | Inspector |
| `p.nair@dept.gov.in` | `password123` | Administrator |

The login screen has one-click "Inspector demo" / "Administrator demo" buttons that fill these in for you.

---

## Project Structure

```
src/
├── main.jsx                     # React entry point
├── App.jsx                      # Route table
├── index.css                    # Tailwind import + design tokens (@theme) + custom animations
│
├── api/
│   ├── client.js                 # fetch wrapper: base URL, auth header injection, error handling
│   ├── auth.js                    # login/logout/me
│   ├── inspections.js             # create/analyze/get/list + adapters to the UI's data shape
│   └── misc.js                    # dashboard, users, rules, PDF report URLs
│
├── hooks/
│   └── useAuthedImages.js        # loads evidence images as blob URLs (the endpoint needs an auth header)
│
├── context/
│   └── AppContext.jsx            # Real auth state (JWT persisted in localStorage) + global toasts
│
├── data/
│   └── mockData.js               # Now only used for shared constants (STATUS enum, rule labels) —
│                                    the dataset itself is no longer read anywhere; see note below
│
├── utils/
│   └── status.js                 # Status -> colour/icon/label mapping, date formatting
│
├── components/
│   ├── ui/                       # Design-system primitives (Button, Card, Input, Badge, Modal, Toast, Stepper, EmptyState...)
│   ├── layout/                   # TopNav, MobileTabBar, AppShell (auth-gated layout wrapper)
│   ├── landing/                  # Marketing site sections (Hero, ScanBackground, Features, HowItWorks, FAQ, CTA, Footer)
│   ├── dashboard/                 # KPI cards, trend chart, violation bars, recent inspections table
│   └── inspection/                # Dropzone, AnalyzingProgress, AnalysisResultView (shared result UI)
│
└── pages/
    ├── Landing.jsx                # Public marketing homepage
    ├── Login.jsx                  # Real auth against the API, with quick-fill demo buttons
    ├── Dashboard.jsx              # Fetches live KPIs/trend/recent inspections
    ├── NewInspection.jsx          # Upload -> real API analyze -> review & save wizard
    ├── Repository.jsx             # Server-side search/filter/pagination against the API
    ├── InspectionDetail.jsx       # Fetches a saved inspection + real evidence images + real PDF
    ├── Reports.jsx                # Lists real inspections, downloads real generated PDFs
    ├── Analytics.jsx              # Real aggregate charts from the dashboard endpoint
    ├── More.jsx                   # Mobile-only "more" menu
    ├── NotFound.jsx
    └── admin/
        ├── AdminTabs.jsx
        ├── AdminUsers.jsx         # Real user list + working "invite user" flow
        └── AdminRules.jsx         # Real compliance rule list + working "create rule" flow
```

> **Note on `mockData.js`:** it's kept only for a handful of shared constants (the `STATUS` enum values, `ruleLabel()`, `summarizeRules()`) used by `AnalysisResultView` and `utils/status.js` for consistent labelling. No component reads the mock `inspections` array, `kpis`, or `dashboardTrend` anymore — every screen is backed by a live API call. It's safe to delete the dataset portions of that file if you want to trim it further.

---

## How Data Flows

Each API module in `src/api/` returns the backend's raw response shape, then an **adapter function** (`adaptInspection`, `adaptListItem` in `api/inspections.js`) reshapes it to match what the UI components expect — this is what let the entire component layer built during the mock-data phase keep working unchanged once the backend was wired in.

```
Backend (snake_case, rule_results[])  →  adaptInspection()  →  Frontend shape (camelCase, rules[])
```

Evidence images are a special case: the backend's `/inspections/images/{id}` endpoint requires an `Authorization` header, which a plain `<img src>` can't send. `hooks/useAuthedImages.js` fetches each image as an authenticated blob and hands back a local object URL instead.

---

## Key Screens & Flows

| Route | Description |
|---|---|
| `/` | Landing page — hero, features, how-it-works, FAQ |
| `/login` | Real authentication; quick-fill buttons for the two demo accounts |
| `/app/dashboard` | KPI summary, trend chart, violation categories, recent inspections — all live |
| `/app/inspection/new` | 3-step wizard: upload → real backend analyze → review & save (auto-saved) |
| `/app/repository` | Full inspection history, server-side search/filter/pagination |
| `/app/inspection/:id` | Saved result: evidence panel with real uploaded image + rule-wise breakdown |
| `/app/reports` | Browse inspections, download real generated PDF reports |
| `/app/analytics` | Aggregate charts computed server-side from the full inspection history |
| `/app/admin/users` | User management (Administrator only) — real invite flow |
| `/app/admin/rules` | Compliance rule library (Administrator only) — real create flow |

Inspectors only ever see their own inspections (dashboard, repository, analytics all scope to `inspector_id` unless you're an Administrator, matching the SRS's role table) — this is enforced on the **backend**, not just hidden in the UI.

---

## Design System

All design tokens (colours, spacing) live in `src/index.css` under `@theme`. The three status colours are used **exclusively** for compliance outcomes and never reused elsewhere in the UI, per the project's UI/UX specification:

- **Success (green)** — PASS
- **Warning (amber)** — REVIEW
- **Danger (red)** — POTENTIAL NON-COMPLIANCE

Primary blue is reserved for navigation/actions; teal (`accent`) marks anything AI/processing-related.

---

## What's Still Simulated

Everything is real **except** the AI pipeline itself. The backend's `run_analysis()` (see `packsure-backend/app/services/analysis.py`) currently returns plausible weighted-random results rather than actually reading the uploaded image — this was a deliberate sequencing choice so the full stack (auth, uploads, database, dashboard aggregates, PDF generation, admin flows) could be built and demoed end-to-end first. See that file's docstring for exactly what to swap in for real OCR + rule evaluation; no frontend code needs to change when you do.

---

## Notes

- Screening results are **decision-support, not legal certification** — this disclaimer is intentionally surfaced on the login screen, the analysis result screen, and every generated report, matching the project's compliance posture.
- This build has no test suite; it's a UI/UX and frontend-architecture prototype for a hackathon submission.
