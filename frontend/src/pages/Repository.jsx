import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Download, ChevronLeft, ChevronRight, FolderClock } from "lucide-react";
import { Card, StatusBadge, Chip } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { listInspections, adaptListItem } from "../api/inspections";
import { formatDate } from "../utils/status";
import { useApp } from "../context/AppContext";

const STATUS_FILTERS = ["All", "PASS", "REVIEW", "POTENTIAL NON-COMPLIANCE"];
const PAGE_SIZE = 6;

export default function Repository() {
  const { user } = useApp();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await listInspections({
          q: debouncedQuery || undefined,
          status: statusFilter === "All" ? undefined : statusFilter,
          scopeAll: user?.role === "Administrator",
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(data.items.map(adaptListItem));
        setTotal(data.total);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [debouncedQuery, statusFilter, page, user]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clearFilters = () => { setQuery(""); setStatusFilter("All"); setPage(1); };

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-800">Inspection Repository</h1>
          <p className="text-sm text-ink-500 mt-1">{total} inspections &middot; search, filter and reopen any past scan</p>
        </div>
        <Button variant="secondary" icon={Download}>Export CSV</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by product name…"
            className="w-full h-11 rounded-lg border border-ink-200 pl-10 pr-3.5 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <Chip key={s} active={statusFilter === s} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s === "All" ? "All" : s === "POTENTIAL NON-COMPLIANCE" ? "Non-Compliant" : s}
            </Chip>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FolderClock}
            title="No inspections found"
            description="Try adjusting your search or filters, or start a new inspection to begin."
            action={
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                <Button as={Link} to="/app/inspection/new">+ New Inspection</Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-b border-ink-100">
                    <th className="font-bold px-5 py-3">Product / ID</th>
                    <th className="font-bold px-3 py-3 hidden sm:table-cell">Inspector</th>
                    <th className="font-bold px-3 py-3 hidden md:table-cell">Date</th>
                    <th className="font-bold px-3 py-3">Score</th>
                    <th className="font-bold px-3 py-3">Status</th>
                    <th className="font-bold px-5 py-3 text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.dbId} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-ink-800">{r.product}</div>
                        <div className="text-[11px] text-ink-400">#{r.id}</div>
                      </td>
                      <td className="px-3 py-3.5 text-ink-500 hidden sm:table-cell">{r.inspector}</td>
                      <td className="px-3 py-3.5 text-ink-500 hidden md:table-cell">{formatDate(r.date)}</td>
                      <td className="px-3 py-3.5 font-bold text-ink-800">{r.score}</td>
                      <td className="px-3 py-3.5"><StatusBadge status={r.status} size="sm" /></td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/app/inspection/${r.dbId}`} className="text-xs font-bold text-primary-600 hover:underline">
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-ink-100">
              <span className="text-xs text-ink-500">
                Showing {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 w-8 rounded-lg border border-ink-200 flex items-center justify-center disabled:opacity-40 hover:bg-ink-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold border ${
                      page === i + 1 ? "bg-primary-50 border-primary-600 text-primary-700" : "border-ink-200 text-ink-500 hover:bg-ink-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 w-8 rounded-lg border border-ink-200 flex items-center justify-center disabled:opacity-40 hover:bg-ink-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
