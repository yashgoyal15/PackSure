import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileDown, AlertTriangle } from "lucide-react";
import Button from "../components/ui/Button";
import AnalysisResultView from "../components/inspection/AnalysisResultView";
import EmptyState from "../components/ui/EmptyState";
import { getInspection, adaptInspection } from "../api/inspections";
import { reportPdfUrl } from "../api/misc";
import { fetchAuthedBlobUrl } from "../api/client";
import { useAuthedImages } from "../hooks/useAuthedImages";
import { formatDate } from "../utils/status";
import { useApp } from "../context/AppContext";

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getInspection(id)
      .then((data) => {
        if (!cancelled) setInspection(adaptInspection(data));
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const images = useAuthedImages(inspection?.rawImages);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const url = await fetchAuthedBlobUrl(reportPdfUrl(id));
      const a = document.createElement("a");
      a.href = url;
      a.download = `packsure-report-${inspection.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Report for #${inspection.id} downloaded`, "success");
    } catch {
      showToast("Could not generate the report. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !inspection) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16">
        <EmptyState
          icon={AlertTriangle}
          title="Inspection not found"
          description={`No saved inspection matches ID #${id}. It may have been removed, or you may not have access to it.`}
          action={<Button as={Link} to="/app/repository">Back to Repository</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-800">{inspection.product}</h1>
          <p className="text-sm text-ink-500 mt-1">
            Inspection #{inspection.id} &middot; {formatDate(inspection.date)} &middot; {inspection.images} image{inspection.images !== 1 ? "s" : ""} &middot; Inspector: {inspection.inspector}
          </p>
        </div>
        <Button variant="secondary" icon={FileDown} loading={downloading} onClick={handleDownloadPdf}>
          {downloading ? "" : "Generate PDF Report"}
        </Button>
      </div>

      <AnalysisResultView inspection={inspection} images={images} editable={false} />
    </div>
  );
}
