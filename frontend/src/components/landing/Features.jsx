import { ScanLine, FileSearch, ShieldAlert, FileText, LayoutDashboard, Lock } from "lucide-react";

const features = [
  {
    icon: ScanLine,
    title: "AI-Powered OCR Scanning",
    desc: "Upload or capture a package image and let computer vision + OCR extract every visible declaration automatically.",
  },
  {
    icon: FileSearch,
    title: "Configurable Rule Engine",
    desc: "Declarations are checked against a rule library aligned with the Legal Metrology (Packaged Commodities) Rules, 2011.",
  },
  {
    icon: ShieldAlert,
    title: "Explainable Results",
    desc: "Every REVIEW or POTENTIAL NON-COMPLIANCE outcome comes with plain-language reasoning and visual evidence \u2014 never a black box.",
  },
  {
    icon: LayoutDashboard,
    title: "Inspection Dashboard",
    desc: "Track trends, common violation categories, and team-wide screening activity from a single, role-aware dashboard.",
  },
  {
    icon: FileText,
    title: "One-Click PDF Reports",
    desc: "Generate a shareable, self-contained compliance report the moment an inspection is complete.",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    desc: "Inspector and Administrator roles share one visual language, with permissions enforced end-to-end on the backend.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-wide text-primary-600 uppercase">Why teams choose PackSure</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mt-3 tracking-tight">
            Everything an inspector needs, nothing they don't
          </h2>
          <p className="text-ink-500 mt-4 text-lg">
            Built around a single goal: turn a manual, paperwork-heavy inspection into a fast, defensible, evidence-backed screening decision.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-ink-200 p-6 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-900/5 transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                <Icon className="h-5 w-5 text-primary-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-ink-800 mt-4">{title}</h3>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
