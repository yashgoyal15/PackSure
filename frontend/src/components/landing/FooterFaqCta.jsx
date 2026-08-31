import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight, ShieldCheck, Globe, Mail } from "lucide-react";
import Button from "../ui/Button";

const faqs = [
  {
    q: "Does PackSure replace a Legal Metrology inspector?",
    a: "No. PackSure is a decision-support tool. Every result is a screening outcome intended for human review, not an automated legal certification, and the app states this clearly on every screen and report.",
  },
  {
    q: "What happens if the OCR can't read a label clearly?",
    a: "The affected field is marked REVIEW rather than silently passing or failing, and the inspector can retry the scan or enter the value manually \u2014 an inspection is never lost to a bad photo.",
  },
  {
    q: "Can the compliance rules be updated?",
    a: "Yes. Rules are configured and versioned separately from the application code, so they can be updated by an Administrator as regulations change, without a full redeployment.",
  },
  {
    q: "Is my data secure?",
    a: "Authentication, role-based authorization, and secure password storage are enforced end-to-end, with all sensitive checks performed on the backend rather than trusted to the client.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-200 py-5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left gap-4">
        <span className="font-semibold text-ink-800">{q}</span>
        <ChevronDown className={`h-5 w-5 text-ink-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-ink-500 mt-3 leading-relaxed pr-8">{a}</p>}
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-wide text-primary-600 uppercase">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mt-3 tracking-tight">Common questions</h2>
        </div>
        <div>
          {faqs.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary-800 to-primary-900 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ready to screen your first package?
        </h2>
        <p className="text-primary-100/80 mt-4 text-lg">
          Sign in to the console and see a full inspection, from upload to PDF report, in under two minutes.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button as={Link} to="/login" size="lg" variant="accent" iconRight={ArrowRight}>
            Launch Console
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink-900 text-white/70 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white">PackSure</span>
            </div>
            <p className="text-sm mt-4 max-w-sm leading-relaxed">
              AI-assisted packaged commodity compliance screening, built for Smart India Hackathon 2026,
              Problem Statement 26034 &mdash; Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> team@packsure.dev</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> github.com/packsure</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>&copy; 2026 PackSure. Built for SIH 2026, PS 26034.</span>
          <span>Screening results are decision-support, not legal certification.</span>
        </div>
      </div>
    </footer>
  );
}
