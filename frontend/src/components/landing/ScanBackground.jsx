import { Package, ScanLine, CheckCircle2, ShieldCheck, Tag } from "lucide-react";

export default function ScanBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-ink-900" />

      {/* Drifting grid */}
      <div
        className="absolute inset-0 opacity-[0.12] animate-grid-drift"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-accent-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[560px] w-[560px] rounded-full bg-primary-500/30 blur-3xl" />

      {/* Floating package card - tucked into the empty gap between headline and preview card */}
      <div className="absolute top-[8%] left-[54%] animate-float-slow hidden xl:block">
        <div className="relative h-24 w-20 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center gap-2">
          <Package className="h-7 w-7 text-white/70" />
          <div className="h-1.5 w-12 rounded-full bg-white/25" />
          <div className="h-1.5 w-8 rounded-full bg-white/20" />
          <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-success-500 flex items-center justify-center ring-4 ring-primary-900/60">
            <CheckCircle2 className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      {/* Floating tag card with scan sweep - sits below the preview card, clear of text */}
      <div className="absolute bottom-[8%] right-[10%] animate-float-slower hidden xl:block">
        <div className="relative h-24 w-24 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col items-center justify-center gap-2">
          <Tag className="h-7 w-7 text-white/70" />
          <div className="h-1.5 w-14 rounded-full bg-white/25" />
          <div className="h-1.5 w-10 rounded-full bg-white/20" />
          <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-accent-400/0 via-accent-300/60 to-accent-400/0 animate-scan-sweep" />
        </div>
      </div>

      {/* Floating badge - bottom-left corner, below the bullet list */}
      <div className="absolute bottom-[3%] left-[6%] animate-float-slow hidden lg:block" style={{ animationDelay: "1.4s" }}>
        <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-2xl flex items-center justify-center">
          <ShieldCheck className="h-7 w-7 text-accent-300" />
        </div>
      </div>

      {/* Scan line beam sweeping the whole hero */}
      <div className="absolute inset-x-0 top-0 h-40 opacity-40">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-300 to-transparent animate-scan-sweep" />
      </div>

      {/* Pulse rings around a central scan icon (desktop only, decorative, right side) */}
      <div className="absolute top-[55%] right-[22%] hidden xl:flex items-center justify-center">
        <div className="absolute h-16 w-16 rounded-full border border-accent-300/50 animate-pulse-ring" />
        <div className="absolute h-16 w-16 rounded-full border border-accent-300/50 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
        <div className="h-10 w-10 rounded-full bg-accent-500/80 flex items-center justify-center">
          <ScanLine className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-ink-50 to-transparent" />
    </div>
  );
}
