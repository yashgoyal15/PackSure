import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, CheckCircle2, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import ScanBackground from "./ScanBackground";

export default function Hero() {
  return (
    <section className="relative pt-14 pb-28 sm:pt-20 sm:pb-36">
      <ScanBackground />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-accent-200">
            <Sparkles className="h-3.5 w-3.5" />
            Smart India Hackathon 2026 &middot; Problem Statement 26034
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
            Scan a label.<br />
            Know it's compliant<span className="text-accent-300">.</span>
          </h1>

          <p className="mt-6 text-lg text-primary-100/90 max-w-xl leading-relaxed">
            PackSure uses AI-powered OCR and a configurable rule engine to screen packaged commodities
            against the Legal Metrology (Packaged Commodities) Rules, 2011 &mdash; turning a manual,
            time-consuming inspection into a 10-second, evidence-backed result.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button as={Link} to="/login" size="lg" variant="accent" iconRight={ArrowRight}>
              Launch Console
            </Button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white px-2 h-12"
            >
              <PlayCircle className="h-5 w-5" /> See how it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-primary-100/80">
            {["Explainable, evidence-backed results", "PASS / REVIEW / NON-COMPLIANCE screening", "PDF reports in one click"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent-300" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Floating result preview card */}
        <div className="hidden lg:block absolute top-16 right-0 w-[380px] animate-float-slow">
          <div className="rounded-2xl bg-white shadow-2xl shadow-black/30 border border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-400">INSPECTION #A214</span>
              <span className="text-[10px] font-bold text-warning-700 bg-warning-50 border border-warning-600/30 rounded-full px-2 py-0.5">REVIEW</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full border-4 border-warning-500 flex items-center justify-center font-extrabold text-warning-700 text-sm">68</div>
              <div>
                <div className="font-bold text-ink-800 text-sm">Basmati Rice 5kg</div>
                <div className="text-xs text-ink-500">2 fields need verification</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[["Net Quantity", true], ["MRP Declaration", false], ["Manufacturer Info", false]].map(([label, ok]) => (
                <div key={label} className="flex items-center justify-between text-xs bg-ink-50 rounded-lg px-2.5 py-2">
                  <span className="text-ink-600 font-medium">{label}</span>
                  <span className={`font-bold ${ok ? "text-success-600" : "text-warning-600"}`}>{ok ? "PASS" : "REVIEW"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
