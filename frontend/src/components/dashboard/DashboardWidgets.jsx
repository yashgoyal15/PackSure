import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowUpRight } from "lucide-react";
import { Card } from "../ui/Primitives";
import { StatusBadge } from "../ui/Primitives";
import { formatDate } from "../../utils/status";

// Recharts' ResponsiveContainer can mis-measure its width on the very first paint
// inside a CSS grid item (before the grid track has settled). Delaying the chart's
// first render by one frame avoids that flash of a squashed/partial chart.
function useChartReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);
  return ready;
}

export function KpiCard({ label, value, accent, sublabel }) {
  return (
    <Card className="p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent}`} />
      <div className="pl-2.5">
        <div className="text-3xl font-extrabold text-ink-800 tabular-nums">{value}</div>
        <div className="text-xs font-semibold text-ink-500 mt-1">{label}</div>
        {sublabel && <div className="text-[11px] text-ink-400 mt-0.5">{sublabel}</div>}
      </div>
    </Card>
  );
}

export function TrendChart({ data }) {
  const ready = useChartReady();
  return (
    <Card className="p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-ink-800 text-sm">Inspection Trend</h3>
          <p className="text-xs text-ink-500">Last 7 days, by screening outcome</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-600" />PASS</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning-600" />REVIEW</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger-600" />N-C</span>
        </div>
      </div>
      <div className="h-56">
        {ready && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 10, top: 6 }}>
            <defs>
              <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
              labelStyle={{ fontWeight: 700 }}
            />
            <Area type="monotone" dataKey="pass" stroke="#16a34a" strokeWidth={2.5} fill="url(#passGrad)" />
            <Area type="monotone" dataKey="review" stroke="#d97706" strokeWidth={2} fill="transparent" />
            <Area type="monotone" dataKey="nonCompliant" stroke="#dc2626" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function ViolationBars({ data }) {
  return (
    <Card className="p-5">
      <h3 className="font-bold text-ink-800 text-sm mb-4">Common Violation Categories</h3>
      <div className="space-y-4">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-ink-700">{d.label}</span>
              <span className="text-ink-500 font-medium">{d.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full rounded-full bg-danger-500" style={{ width: `${(d.pct / 40) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RecentInspectionsTable({ rows }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="font-bold text-ink-800 text-sm">Recent Inspections</h3>
        <NavLink to="/app/repository" className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </NavLink>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-y border-ink-100">
              <th className="font-bold px-5 py-2.5">Product</th>
              <th className="font-bold px-3 py-2.5 hidden sm:table-cell">Inspector</th>
              <th className="font-bold px-3 py-2.5 hidden md:table-cell">Date</th>
              <th className="font-bold px-3 py-2.5">Score</th>
              <th className="font-bold px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/70 transition-colors">
                <td className="px-5 py-3">
                  <NavLink to={`/app/inspection/${r.dbId ?? r.id}`} className="font-semibold text-ink-800 hover:text-primary-600">
                    {r.product}
                  </NavLink>
                  <div className="text-[11px] text-ink-400">#{r.id}</div>
                </td>
                <td className="px-3 py-3 text-ink-500 hidden sm:table-cell">{r.inspector}</td>
                <td className="px-3 py-3 text-ink-500 hidden md:table-cell">{formatDate(r.date)}</td>
                <td className="px-3 py-3 font-bold text-ink-800">{r.score}</td>
                <td className="px-3 py-3"><StatusBadge status={r.status} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
