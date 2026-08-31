import { LogIn, ScanLine, Cpu, ClipboardCheck, FileCheck2 } from "lucide-react";

const steps = [
  { icon: LogIn, title: "Sign In", desc: "Inspector logs in with department credentials." },
  { icon: ScanLine, title: "Capture", desc: "Upload or photograph the package label directly in the app." },
  { icon: Cpu, title: "AI Analysis", desc: "OCR and the rule engine process the image in under 10 seconds." },
  { icon: ClipboardCheck, title: "Review", desc: "Confirm extracted fields; low-confidence values are flagged, not assumed." },
  { icon: FileCheck2, title: "Report", desc: "Save the inspection and export a shareable PDF compliance report." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-ink-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-bold tracking-wide text-primary-600 uppercase">How it works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mt-3 tracking-tight">
            From label to report in five steps
          </h2>
        </div>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-ink-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-white border-2 border-primary-600 shadow-sm flex items-center justify-center relative z-10">
                  <Icon className="h-7 w-7 text-primary-600" />
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-ink-800 mt-4">{title}</h3>
                <p className="text-sm text-ink-500 mt-1.5 px-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
