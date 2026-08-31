import { useState } from "react";
import { Info, Edit3, Check } from "lucide-react";
import { Card, StatusBadge } from "../ui/Primitives";
import { statusStyles, scoreColor } from "../../utils/status";
import { STATUS, ruleLabel, summarizeRules } from "../../data/mockData";

function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - score / 100);
  const color = score >= 80 ? "#16a34a" : score >= 55 ? "#d97706" : "#dc2626";
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="6" />
        <circle
          cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-extrabold text-lg ${scoreColor(score)}`}>
        {score}
      </div>
    </div>
  );
}

const heroCopy = {
  [STATUS.PASS]: "All required declarations were detected and satisfy configured checks.",
  [STATUS.REVIEW]: "Some fields require manual verification before this package can be confirmed compliant.",
  [STATUS.NON_COMPLIANT]: "One or more required declarations appear missing or inconsistent. Human review is required.",
};

export default function AnalysisResultView({ inspection, images = [], editable = false, onFieldConfirm }) {
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [activeRuleId, setActiveRuleId] = useState(null);

  const rules = inspection.rules.map((r) =>
    confirmedIds.includes(r.id) ? { ...r, status: STATUS.PASS, confidence: 99 } : r
  );
  const summary = summarizeRules(rules);
  const heroStyle = statusStyles[inspection.status] || statusStyles[STATUS.REVIEW];
  const HeroIcon = heroStyle.icon;

  const confirmField = (id) => {
    setConfirmedIds((c) => [...c, id]);
    onFieldConfirm?.(id);
  };

  const previewImg = images[0]?.url;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className={`rounded-2xl border ${heroStyle.border} ${heroStyle.bg} p-5 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <ScoreRing score={inspection.score} />
          <div className="flex-1">
            <div className={`flex items-center gap-2 font-extrabold text-xl ${heroStyle.text}`}>
              <HeroIcon className="h-5 w-5" />
              {heroStyle.label}
            </div>
            <p className="text-sm text-ink-700 mt-1 max-w-xl">{heroCopy[inspection.status]}</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 pl-0 sm:pl-4 sm:border-l border-ink-900/10">
            <div className="text-center">
              <div className="font-extrabold text-success-700">{summary.pass}</div>
              <div className="text-[10px] font-bold text-ink-500 uppercase">Pass</div>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-warning-700">{summary.review}</div>
              <div className="text-[10px] font-bold text-ink-500 uppercase">Review</div>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-danger-700">{summary.nonCompliant}</div>
              <div className="text-[10px] font-bold text-ink-500 uppercase">Non-Comp.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Evidence panel */}
        <Card className="p-5 lg:col-span-2 h-fit">
          <h3 className="font-bold text-ink-800 text-sm mb-3">Evidence</h3>
          <div className="relative rounded-xl overflow-hidden border border-ink-200 bg-ink-100 flex items-center justify-center">
            {previewImg ? (
              // object-contain (not object-cover) + no forced aspect ratio: the
              // wrapper's rendered size now exactly matches the displayed image,
              // whatever its real aspect ratio is. Since the OCR boxes below are
              // positioned in % of the *original* image, they only line up
              // correctly when this container has no cropping/letterboxing of
              // its own — object-contain guarantees that.
              <img src={previewImg} alt="Package evidence" className="block w-full h-auto max-h-[520px] object-contain" />
            ) : (
              <div className="aspect-[4/3] w-full flex items-center justify-center">
                <span className="text-xs text-ink-400 px-6 text-center">Package label preview with OCR bounding-box overlays</span>
              </div>
            )}
            {rules.filter((r) => r.box).map((r) => {
              const s = statusStyles[r.status];
              const active = activeRuleId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveRuleId(r.id)}
                  className={`absolute border-2 border-dashed rounded cursor-pointer transition-all ${active ? "ring-2 ring-offset-1 ring-primary-500" : ""}`}
                  style={{
                    left: `${r.box.x}%`, top: `${r.box.y}%`, width: `${r.box.w}%`, height: `${r.box.h}%`,
                    borderColor: r.status === STATUS.PASS ? "#16a34a" : r.status === STATUS.REVIEW ? "#d97706" : "#dc2626",
                  }}
                  title={ruleLabel(r.id)}
                />
              );
            })}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <div key={img.id} className={`h-12 w-12 rounded-lg overflow-hidden border-2 ${i === 0 ? "border-primary-500" : "border-ink-200"}`}>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-ink-100">
            <p className="text-xs font-bold text-ink-700 mb-2">Legend</p>
            <div className="space-y-1.5 text-xs text-ink-500">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-success-600" />Confirmed</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-warning-600" />Low confidence</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-danger-600" />Missing / invalid</div>
            </div>
          </div>
        </Card>

        {/* Rule results */}
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink-800 text-sm">Rule-wise Results</h3>
            <span className="text-xs text-ink-500">{rules.length} checks evaluated &middot; rules {inspection.ruleVersion}</span>
          </div>
          <div className="space-y-2.5">
            {rules.map((r) => {
              const s = statusStyles[r.status];
              const isConfirming = editable && r.status === STATUS.REVIEW;
              return (
                <div
                  key={r.id}
                  onMouseEnter={() => setActiveRuleId(r.id)}
                  className={`relative rounded-xl border pl-4 pr-3.5 py-3 flex items-start justify-between gap-3 transition-colors ${
                    activeRuleId === r.id ? "border-primary-300 bg-primary-50/40" : "border-ink-200"
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${s.solid}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-ink-800">{ruleLabel(r.id)}</div>
                    <div className="text-xs text-ink-500 mt-0.5">{r.detail}</div>
                    {/* Only show a confidence readout for statuses where `confidence`
                        is an actual per-field OCR confidence (PASS, or REVIEW from a
                        low-confidence match). For "not detected" NON-COMPLIANT rows the
                        backend intentionally sends confidence=0, since there is no
                        field-level number to show (see rules_engine.py evaluate_field). */}
                    {r.confidence > 0 && (
                      <div className="text-[10px] text-ink-400 mt-1 font-medium">Confidence {r.confidence}%</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={r.status} size="sm" />
                    {isConfirming && (
                      <button
                        onClick={() => confirmField(r.id)}
                        className="text-[11px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" /> Confirm
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-primary-50 border border-primary-100">
            <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-800">
              This is an automated screening result intended to support &mdash; not replace &mdash; manual regulatory review.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
