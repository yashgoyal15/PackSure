const stats = [
  { value: "< 10s", label: "Average screening time per package" },
  { value: "9", label: "Declaration categories checked per scan" },
  { value: "3", label: "Clear outcomes: Pass, Review, Non-Compliant" },
  { value: "100%", label: "Evidence-backed, explainable results" },
];

export default function Stats() {
  return (
    <section id="trust" className="bg-ink-900 py-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</div>
              <div className="text-sm text-white/60 mt-1.5 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
