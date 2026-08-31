import { useEffect, useState } from "react";
import { Check, ScanEye } from "lucide-react";
import { ProgressBar } from "../ui/Primitives";

const STEPS = [
  "Preprocessing image",
  "Running OCR text detection",
  "Extracting declaration fields",
  "Evaluating compliance rules",
  "Calculating screening score",
];

export default function AnalyzingProgress({ onDone, durationMs = 4200 }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTime = durationMs / STEPS.length;
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
    }, stepTime);
    const start = Date.now();
    const progTimer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progTimer);
        clearInterval(stepTimer);
        setTimeout(onDone, 350);
      }
    }, 60);
    return () => { clearInterval(stepTimer); clearInterval(progTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto text-center py-10">
      <div className="relative h-24 w-24 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="46" fill="none" stroke="#1d4ed8" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress / 100)}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <ScanEye className="h-8 w-8 text-primary-600" />
        </div>
      </div>
      <h3 className="font-extrabold text-lg text-ink-800">Analyzing package image&hellip;</h3>
      <p className="text-sm text-ink-500 mt-1">This usually takes under 10 seconds</p>

      <div className="mt-7 space-y-3 text-left bg-white border border-ink-200 rounded-2xl p-5">
        {STEPS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  done ? "bg-success-600 border-success-600" : active ? "border-primary-600" : "border-ink-200"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  active && <div className="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                )}
              </div>
              <span className={`text-sm ${active ? "font-bold text-ink-800" : done ? "text-ink-600" : "text-ink-400"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <ProgressBar value={progress} className="mt-5" />
    </div>
  );
}
