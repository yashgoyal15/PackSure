import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { ShieldCheck, Menu, X } from "lucide-react";
import Button from "../ui/Button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#trust", label: "Why PackSure" },
  { href: "#faq", label: "FAQ" },
];

export default function PublicNav({ transparent }) {
  const [open, setOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-50 ${transparent ? "bg-transparent" : "bg-white/90 backdrop-blur border-b border-ink-200"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-18 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className={`font-extrabold text-lg tracking-tight ${transparent ? "text-white" : "text-ink-800"}`}>
            Pack<span className={transparent ? "text-accent-300" : "text-primary-600"}>Sure</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold transition-colors ${
                transparent ? "text-white/80 hover:text-white" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className={`text-sm font-semibold px-4 h-10 flex items-center rounded-lg transition-colors ${
              transparent ? "text-white hover:bg-white/10" : "text-ink-700 hover:bg-ink-100"
            }`}
          >
            Sign In
          </Link>
          <Button as={Link} to="/login" size="sm" variant={transparent ? "accent" : "primary"}>
            Get Started
          </Button>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className={`md:hidden h-10 w-10 flex items-center justify-center rounded-lg ${transparent ? "text-white" : "text-ink-700"}`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-ink-200 px-5 py-4 space-y-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-semibold text-ink-700 py-1.5">
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Button as={Link} to="/login" variant="outline" className="flex-1">Sign In</Button>
            <Button as={Link} to="/login" className="flex-1">Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
}
