import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, ScanLine, FolderClock, FileText, BarChart3, ShieldCheck,
  ChevronDown, LogOut, Settings, UserCog,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/inspection/new", label: "New Inspection", icon: ScanLine },
  { to: "/app/repository", label: "Repository", icon: FolderClock },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

export default function TopNav() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = user?.role === "Administrator" ? [...navItems, { to: "/app/admin/users", label: "Administration", icon: ShieldCheck }] : navItems;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink-200 hidden md:block">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-8">
        <NavLink to="/app/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-ink-800 text-[15px] tracking-tight">
            Pack<span className="text-primary-600">Sure</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1 flex-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 h-9 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? "bg-primary-50 text-primary-700" : "text-ink-500 hover:text-ink-800 hover:bg-ink-100"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="relative shrink-0" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-2 pr-3 h-10 rounded-full hover:bg-ink-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-accent-100 border border-accent-600/30 text-accent-700 flex items-center justify-center text-xs font-bold">
              {user?.initials}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-ink-800 leading-tight">{user?.name}</div>
              <div className="text-[11px] text-ink-500 leading-tight">{user?.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-ink-100 py-1.5 animate-fade-up">
              <div className="px-3.5 py-2 border-b border-ink-100 mb-1">
                <div className="text-sm font-bold text-ink-800">{user?.name}</div>
                <div className="text-xs text-ink-500">{user?.email}</div>
              </div>
              <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50">
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50">
                <UserCog className="h-4 w-4" /> My Profile
              </button>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger-600 hover:bg-danger-50"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
