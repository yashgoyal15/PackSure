import { NavLink } from "react-router-dom";
import { LayoutDashboard, ScanLine, FolderClock, MoreHorizontal } from "lucide-react";

const tabs = [
  { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/app/inspection/new", label: "Scan", icon: ScanLine, primary: true },
  { to: "/app/repository", label: "History", icon: FolderClock },
  { to: "/app/more", label: "More", icon: MoreHorizontal },
];

export default function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-200 flex md:hidden">
      {tabs.map(({ to, label, icon: Icon, primary }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              isActive ? "text-primary-600" : "text-ink-400"
            }`
          }
        >
          {({ isActive }) =>
            primary ? (
              <>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center -mt-5 shadow-lg shadow-primary-600/30 ${isActive ? "bg-primary-700" : "bg-primary-600"}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="mt-0.5">{label}</span>
              </>
            ) : (
              <>
                <Icon className="h-5 w-5" />
                {label}
              </>
            )
          }
        </NavLink>
      ))}
    </nav>
  );
}
