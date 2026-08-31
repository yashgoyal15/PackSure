import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../components/ui/Button";
import { KpiCard, TrendChart, ViolationBars, RecentInspectionsTable } from "../components/dashboard/DashboardWidgets";
import { getDashboard } from "../api/misc";
import { listInspections, adaptListItem } from "../api/inspections";
import { useApp } from "../context/AppContext";

export default function Dashboard() {
  const { user } = useApp();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const [dash, setDash] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [dashData, listData] = await Promise.all([
          getDashboard(user?.role === "Administrator"),
          listInspections({ page: 1, pageSize: 6, scopeAll: user?.role === "Administrator" }),
        ]);
        if (cancelled) return;
        setDash(dashData);
        setRecent(listData.items.map(adaptListItem));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-800">Good to see you, {firstName}</h1>
          <p className="text-sm text-ink-500 mt-1">Here's what's happening with your inspections today</p>
        </div>
        <Button as={Link} to="/app/inspection/new" icon={Plus}>New Inspection</Button>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Inspections" value={dash.total} accent="bg-primary-600" />
            <KpiCard label="PASS" value={dash.pass} accent="bg-success-600" />
            <KpiCard label="REVIEW" value={dash.review} accent="bg-warning-600" />
            <KpiCard label="POTENTIAL NON-COMPLIANCE" value={dash.nonCompliant} accent="bg-danger-600" />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            <TrendChart data={dash.trend} />
            <ViolationBars data={dash.violationCategories} />
          </div>

          <RecentInspectionsTable rows={recent} />
        </>
      )}
    </div>
  );
}
