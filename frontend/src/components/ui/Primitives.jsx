import { statusStyles } from "../../utils/status";

export function StatusBadge({ status, size = "md" }) {
  const s = statusStyles[status];
  if (!s) return null;
  const Icon = s.icon;
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${s.bg} ${s.text} ${s.border} ${sizeCls}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {s.label}
    </span>
  );
}

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white border border-ink-200 rounded-2xl transition-shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ label, hint, error, className = "", required, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-bold uppercase tracking-wide text-ink-700 mb-1.5">
          {label} {required && <span className="text-danger-600">*</span>}
        </span>
      )}
      <input
        className={`w-full h-11 rounded-lg border px-3.5 text-sm text-ink-800 placeholder:text-ink-400 outline-none transition-colors focus:ring-2 focus:ring-primary-200 ${
          error ? "border-danger-500 focus:border-danger-500" : "border-ink-200 focus:border-primary-500"
        } ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-ink-500 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger-600 mt-1">{error}</span>}
    </label>
  );
}

export function Select({ label, children, className = "", required, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-bold uppercase tracking-wide text-ink-700 mb-1.5">
          {label} {required && <span className="text-danger-600">*</span>}
        </span>
      )}
      <select
        className={`w-full h-11 rounded-lg border border-ink-200 px-3.5 text-sm text-ink-800 outline-none bg-white transition-colors focus:ring-2 focus:ring-primary-200 focus:border-primary-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Chip({ active, children, ...props }) {
  return (
    <button
      className={`h-10 px-3.5 rounded-lg border text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
        active
          ? "border-primary-600 bg-primary-50 text-primary-700"
          : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, className = "", color = "bg-primary-600" }) {
  return (
    <div className={`h-2 rounded-full bg-ink-100 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
