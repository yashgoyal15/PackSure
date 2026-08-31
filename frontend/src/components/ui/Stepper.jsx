import { Check } from "lucide-react";

export default function Stepper({ steps, current }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done
                    ? "bg-success-600 border-success-600 text-white"
                    : active
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "bg-white border-ink-200 text-ink-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : idx}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold whitespace-nowrap ${
                  active ? "text-ink-800" : done ? "text-ink-600" : "text-ink-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-10 sm:w-16 mx-2 rounded ${done ? "bg-success-600" : "bg-ink-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
