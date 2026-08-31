import { Link } from "react-router-dom";
import { FileText, BarChart3, ShieldCheck, Settings, LogOut, ChevronRight } from "lucide-react";
import { Card } from "../components/ui/Primitives";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function More() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const items = [
    { to: "/app/reports", label: "Reports", icon: FileText },
    { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
    ...(user?.role === "Administrator" ? [{ to: "/app/admin/users", label: "Administration", icon: ShieldCheck }] : []),
    { to: "#", label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-accent-100 text-accent-700 border border-accent-600/30 flex items-center justify-center font-bold">
          {user?.initials}
        </div>
        <div>
          <div className="font-bold text-ink-800">{user?.name}</div>
          <div className="text-xs text-ink-500">{user?.role}</div>
        </div>
      </div>

      <Card className="divide-y divide-ink-100 overflow-hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={label} to={to} className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-sm font-semibold text-ink-700">
              <Icon className="h-4 w-4 text-ink-400" /> {label}
            </span>
            <ChevronRight className="h-4 w-4 text-ink-300" />
          </Link>
        ))}
      </Card>

      <button
        onClick={() => { logout(); navigate("/"); }}
        className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-bold text-danger-600 py-3.5 rounded-xl border border-danger-200 bg-danger-50"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
    </div>
  );
}
