import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileDown, RotateCcw, AlertCircle, HelpCircle } from "lucide-react";
import Stepper from "../components/ui/Stepper";
import Button from "../components/ui/Button";
import { Card, Select, Input } from "../components/ui/Primitives";
import Dropzone from "../components/inspection/Dropzone";
import AnalyzingProgress from "../components/inspection/AnalyzingProgress";
import AnalysisResultView from "../components/inspection/AnalysisResultView";
import { createInspection, analyzeInspection, adaptInspection } from "../api/inspections";
import { reportPdfUrl } from "../api/misc";
import { fetchAuthedBlobUrl, ApiError } from "../api/client";
import { useApp } from "../context/AppContext";

const STEPS = ["Upload Image", "AI Analysis", "Review & Save"];

export default function NewInspection() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [step, setStep] = useState(1); // 1 upload, 2 analyzing, 3 review/result
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [packageType, setPackageType] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // adapted inspection, already "saved" once analyzed
  const [downloading, setDownloading] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  const canAnalyze = images.length > 0;

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      setError("Please attach at least one package image before analyzing.");
      return;
    }
    setError("");
    setSubmitting(true);
    setAnimDone(false);
    setStep(2);
    try {
      const created = await createInspection({ productName, category, packageType, images });
      const analyzed = await analyzeInspection(created.id);
      setResult(adaptInspection(analyzed));
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Something went wrong while analyzing the image.";
      setError(message);
      showToast(message, "error");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  // The progress animation and the real API call run concurrently; only
  // advance to the result screen once BOTH the (purely cosmetic) minimum
  // animation time has elapsed AND the real result has arrived — whichever
  // finishes last. This avoids either a flash-of-instant-result or getting
  // stuck if the request happens to outlast the animation.
  const handleAnalysisDone = () => setAnimDone(true);

  useEffect(() => {
    if (animDone && result && step === 2) setStep(3);
  }, [animDone, result, step]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const url = await fetchAuthedBlobUrl(reportPdfUrl(result.dbId));
      const a = document.createElement("a");
      a.href = url;
      a.download = `packsure-report-${result.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Report downloaded", "success");
    } catch {
      showToast("Could not generate the report. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleRestart = () => {
    setImages([]);
    setResult(null);
    setStep(1);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-800">New Inspection</h1>
          <p className="text-sm text-ink-500 mt-1">
            {step === 1 && "Step 1 of 3 — Upload package image"}
            {step === 2 && "Step 2 of 3 — AI is analyzing the package"}
            {step === 3 && "Step 3 of 3 — Review results"}
          </p>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      {step === 1 && (
        <div className="grid lg:grid-cols-5 gap-5">
          <Card className="p-5 sm:p-6 lg:col-span-3">
            <h3 className="font-bold text-ink-800 text-sm mb-4">Package Image</h3>
            <Dropzone
              images={images}
              onAdd={(files) => setImages((prev) => [...prev, ...files])}
              onRemove={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
            />
            {error && (
              <div className="flex items-center gap-2 mt-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold px-3.5 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6 lg:col-span-2 h-fit">
            <h3 className="font-bold text-ink-800 text-sm">Product Context</h3>
            <p className="text-xs text-ink-500 mt-1 mb-4">Optional &mdash; helps the rule engine apply the right checks</p>
            <div className="space-y-4">
              <Select label="Product Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category</option>
                <option>Food & Grocery</option>
                <option>Personal Care</option>
                <option>Household</option>
                <option>Electronics</option>
              </Select>
              <Input
                label="Product Name"
                placeholder="e.g. Basmati Rice 5kg"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <Select label="Package Type" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                <option value="">Select package type</option>
                <option>Pouch</option>
                <option>Bottle</option>
                <option>Box</option>
                <option>Sachet</option>
              </Select>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-primary-50 border border-primary-100 p-3.5">
              <HelpCircle className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
              <p className="text-xs text-primary-800">
                Hold the camera flat and fill the frame with the label for the best OCR accuracy.
              </p>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card className="p-6 sm:p-10">
          <AnalyzingProgress onDone={handleAnalysisDone} durationMs={2600} />
        </Card>
      )}

      {step === 3 && result && (
        <div className="space-y-5">
          <AnalysisResultView inspection={result} images={images} editable={false} />
          <p className="text-xs text-ink-400 text-center">
            Saved automatically as inspection #{result.id} in the Repository.
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="sticky bottom-16 md:bottom-0 mt-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 bg-white/95 backdrop-blur border-t border-ink-200 flex items-center justify-between gap-3">
        {step === 1 && (
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button iconRight={ArrowRight} onClick={handleAnalyze} loading={submitting}>
              {submitting ? "" : "Analyze"}
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button variant="outline" icon={ArrowLeft} onClick={() => setStep(1)}>Cancel</Button>
            <div />
          </>
        )}
        {step === 3 && (
          <>
            <Button variant="outline" icon={RotateCcw} onClick={handleRestart}>New Scan</Button>
            <div className="flex items-center gap-3">
              <Button variant="secondary" icon={FileDown} loading={downloading} onClick={handleDownloadPdf}>
                {downloading ? "" : "Generate PDF"}
              </Button>
              <Button variant="primary" onClick={() => navigate("/app/repository")}>
                View in Repository
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
