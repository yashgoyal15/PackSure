import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Card } from "../components/ui/Primitives";
import { getDashboard } from "../api/misc";
import { useApp } from "../context/AppContext";

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

const pieColors = ["#16a34a", "#d97706", "#dc2626"];

export default function Analytics() {
  const { user } = useApp();
  const ready = useChartReady();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDashboard(user?.role === "Administrator")
      .then((d) => { if (!cancelled) setDash(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !dash) {
    return (
      <div className="py-24 flex justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  const pieData = [
    { name: "PASS", value: dash.pass },
    { name: "REVIEW", value: dash.review },
    { name: "POTENTIAL NON-COMPLIANCE", value: dash.nonCompliant },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-800">Analytics</h1>
        <p className="text-sm text-ink-500 mt-1">Aggregate screening outcomes and violation trends across all inspections</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-ink-800 text-sm mb-4">Daily Inspections by Outcome</h3>
          <div className="h-72">
            {ready && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dash.trend} margin={{ left: -20 }}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="pass" stackId="a" fill="#16a34a" />
                  <Bar dataKey="review" stackId="a" fill="#d97706" />
                  <Bar dataKey="nonCompliant" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-ink-800 text-sm mb-4">Overall Outcome Split</h3>
          <div className="h-56">
            {ready && dash.total > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-600 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i] }} /> {d.name}
                </span>
                <span className="font-bold text-ink-800">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-ink-800 text-sm mb-4">Common Violation Categories</h3>
        {dash.violationCategories.length === 0 ? (
          <p className="text-sm text-ink-400">No flagged declarations yet.</p>
        ) : (
          <div className="space-y-4">
            {dash.violationCategories.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-ink-700">{d.label}</span>
                  <span className="text-ink-500 font-medium">{d.pct}% of flagged inspections</span>
                </div>
                <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full rounded-full bg-danger-500" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
