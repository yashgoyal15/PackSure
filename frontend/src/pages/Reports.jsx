import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Download, Eye } from "lucide-react";
import { Card, StatusBadge } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { listInspections, adaptListItem } from "../api/inspections";
import { reportPdfUrl } from "../api/misc";
import { fetchAuthedBlobUrl } from "../api/client";
import { formatDate } from "../utils/status";
import { useApp } from "../context/AppContext";

export default function Reports() {
  const { user, showToast } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listInspections({ page: 1, pageSize: 20, scopeAll: user?.role === "Administrator" })
      .then((data) => {
        if (!cancelled) setRows(data.items.map(adaptListItem));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const download = async (r) => {
    setDownloadingId(r.dbId);
    try {
      const url = await fetchAuthedBlobUrl(reportPdfUrl(r.dbId));
      const a = document.createElement("a");
      a.href = url;
      a.download = `packsure-report-${r.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Report for #${r.id} downloaded`, "success");
    } catch {
      showToast("Could not generate the report. Please try again.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-800">Reports</h1>
        <p className="text-sm text-ink-500 mt-1">Generate a shareable, self-contained compliance report for any completed inspection</p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <Card key={r.dbId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-800">{r.product}</div>
                <div className="text-xs text-ink-500 mt-0.5">
                  #{r.id} &middot; {formatDate(r.date)} &middot; Inspector: {r.inspector}
                </div>
              </div>
              <StatusBadge status={r.status} size="sm" />
              <div className="flex items-center gap-2 shrink-0">
                <Button as={Link} to={`/app/inspection/${r.dbId}`} variant="outline" size="sm" icon={Eye}>View</Button>
                <Button size="sm" icon={Download} loading={downloadingId === r.dbId} onClick={() => download(r)}>
                  {downloadingId === r.dbId ? "" : "PDF"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
