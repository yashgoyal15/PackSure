import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

const variants = {
  success: { icon: CheckCircle2, dot: "text-success-400" },
  error: { icon: XCircle, dot: "text-danger-400" },
  info: { icon: Info, dot: "text-primary-400" },
};

export default function ToastHost() {
  const { toast, setToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    if (toast.variant === "error") return; // errors persist until dismissed
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;
  const v = variants[toast.variant] || variants.success;
  const Icon = v.icon;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
      <div className="flex items-center gap-3 bg-ink-900 text-white rounded-xl shadow-xl shadow-black/20 px-4 py-3 pr-2 max-w-sm">
        <Icon className={`h-5 w-5 shrink-0 ${v.dot}`} />
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="ml-1 h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
