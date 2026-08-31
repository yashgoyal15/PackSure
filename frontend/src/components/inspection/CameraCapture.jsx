import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X, Check, AlertTriangle, ScanLine, Hand } from "lucide-react";

// --- Auto-capture tuning -----------------------------------------------
// Frames are sampled onto a tiny offscreen canvas so this stays cheap even
// on low-end phones. "Steady" = motion between consecutive samples stays
// below MOTION_THRESHOLD for STABLE_FRAMES_NEEDED samples in a row (roughly
// STABLE_FRAMES_NEEDED * SAMPLE_INTERVAL_MS of the user holding still over
// the label) — that's the actual "auto scan" trigger, no button needed.
const SAMPLE_INTERVAL_MS = 180;
const STABLE_FRAMES_NEEDED = 5; // ~0.9s held still
const MOTION_THRESHOLD = 6; // mean per-pixel luma delta (0-255 scale) below this = "still"
const MIN_BRIGHTNESS = 25; // reject near-black frames (lens covered / too dark)
const MAX_BRIGHTNESS = 240; // reject near-white/blown-out frames
const AUTO_CONFIRM_DELAY_MS = 900; // grace window to hit "Retake" after an auto-capture

/**
 * Live camera capture using getUserMedia, with an auto-scan mode: instead of
 * requiring a manual shutter tap, it continuously samples the video feed and
 * fires the capture automatically once the frame is held steady (and isn't
 * too dark/blown-out) for ~STABLE_FRAMES_NEEDED samples — the same
 * "hold it still over the label and it just grabs it" UX as a document/QR
 * scanner. Manual tap-to-capture is still available (and used automatically
 * whenever auto-scan is toggled off).
 *
 * Usage: <CameraCapture open={open} onClose={...} onCapture={(file) => ...} />
 * `onCapture` receives a real File object (image/jpeg).
 */
export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // full-res capture canvas
  const sampleCanvasRef = useRef(null); // tiny offscreen canvas for motion/brightness sampling
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const prevFrameRef = useRef(null); // Uint8ClampedArray luma of the previous sample
  const stableCountRef = useRef(0);
  const autoConfirmTimerRef = useRef(null);
  const capturingRef = useRef(false); // guards against double-trigger while a capture is in flight

  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // back camera by default
  const [captured, setCaptured] = useState(null); // { blob, url, auto } preview before confirming
  const [autoScan, setAutoScan] = useState(true);
  const [scanStatus, setScanStatus] = useState("searching"); // "searching" | "holding" | "captured"

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopScanLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (autoConfirmTimerRef.current) {
      clearTimeout(autoConfirmTimerRef.current);
      autoConfirmTimerRef.current = null;
    }
    prevFrameRef.current = null;
    stableCountRef.current = 0;
    capturingRef.current = false;
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError(
        err?.name === "NotAllowedError"
          ? "Camera access was denied. Allow camera permission in your browser settings and try again."
          : "Could not access a camera on this device."
      );
    }
  }, [facingMode, stopStream]);

  const takeShot = useCallback(
    ({ auto = false } = {}) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth || capturingRef.current) return;
      capturingRef.current = true;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          capturingRef.current = false;
          if (!blob) return;
          setCaptured({ blob, url: URL.createObjectURL(blob), auto });
          setScanStatus("captured");
        },
        "image/jpeg",
        0.92
      );
    },
    []
  );

  // --- The actual "live scanning" loop ---------------------------------
  const runScanLoop = useCallback(() => {
    stopScanLoop();
    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const sampleCanvas = sampleCanvasRef.current;
      if (!video || !sampleCanvas || !video.videoWidth || capturingRef.current) return;

      const SW = 96, SH = 72; // tiny sample size — this loop runs ~5x/sec
      sampleCanvas.width = SW;
      sampleCanvas.height = SH;
      const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, SW, SH);
      const { data } = ctx.getImageData(0, 0, SW, SH);

      const luma = new Uint8ClampedArray(SW * SH);
      let brightnessSum = 0;
      for (let p = 0, i = 0; p < data.length; p += 4, i++) {
        const y = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        luma[i] = y;
        brightnessSum += y;
      }
      const brightness = brightnessSum / luma.length;

      const prev = prevFrameRef.current;
      let motion = Infinity;
      if (prev) {
        let diffSum = 0;
        for (let i = 0; i < luma.length; i++) diffSum += Math.abs(luma[i] - prev[i]);
        motion = diffSum / luma.length;
      }
      prevFrameRef.current = luma;

      const wellLit = brightness >= MIN_BRIGHTNESS && brightness <= MAX_BRIGHTNESS;
      const still = motion <= MOTION_THRESHOLD;

      if (wellLit && still) {
        stableCountRef.current += 1;
      } else {
        stableCountRef.current = 0;
      }

      if (!wellLit) {
        setScanStatus("searching");
      } else if (stableCountRef.current > 0 && stableCountRef.current < STABLE_FRAMES_NEEDED) {
        setScanStatus("holding");
      } else if (stableCountRef.current === 0) {
        setScanStatus("searching");
      }

      if (wellLit && stableCountRef.current >= STABLE_FRAMES_NEEDED) {
        stableCountRef.current = 0;
        takeShot({ auto: true });
      }
    }, SAMPLE_INTERVAL_MS);
  }, [stopScanLoop, takeShot]);

  useEffect(() => {
    if (!open) {
      stopStream();
      stopScanLoop();
      setCaptured(null);
      setScanStatus("searching");
      return;
    }
    startStream();
    return () => {
      stopStream();
      stopScanLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  // Kick off (or stop) the auto-scan loop whenever we're actively streaming,
  // not showing a captured preview, and auto-scan is toggled on.
  useEffect(() => {
    if (open && !error && !captured && autoScan) {
      setScanStatus("searching");
      runScanLoop();
    } else {
      stopScanLoop();
    }
    return () => stopScanLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, error, captured, autoScan]);

  // After an *auto* capture, give the user a brief grace window (with a
  // visible "Retake" option) before auto-confirming and closing — this is
  // what makes "no button needed" feel safe instead of trigger-happy.
  useEffect(() => {
    if (captured?.auto) {
      autoConfirmTimerRef.current = setTimeout(() => {
        confirmRef.current?.();
      }, AUTO_CONFIRM_DELAY_MS);
      return () => clearTimeout(autoConfirmTimerRef.current);
    }
  }, [captured]);

  const retake = () => {
    if (autoConfirmTimerRef.current) clearTimeout(autoConfirmTimerRef.current);
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setScanStatus("searching");
  };

  const confirm = useCallback(() => {
    setCaptured((c) => {
      if (!c) return c;
      const file = new File([c.blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      return null;
    });
    onClose();
  }, [onCapture, onClose]);

  // Kept in a ref so the setTimeout above always calls the latest `confirm`
  // without needing to re-schedule the timer on every render.
  const confirmRef = useRef(confirm);
  useEffect(() => {
    confirmRef.current = confirm;
  }, [confirm]);

  if (!open) return null;

  const statusCopy = {
    searching: "Point the camera at the package label",
    holding: "Hold still\u2026",
    captured: "Captured",
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/80" onClick={onClose} />
      <div className="relative bg-ink-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-ink-900">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" /> Scan Package Label
          </h3>
          <div className="flex items-center gap-3">
            {!error && !captured && (
              <button
                onClick={() => setAutoScan((v) => !v)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors ${
                  autoScan ? "bg-accent-500/20 text-accent-500" : "bg-white/10 text-white/70"
                }`}
                title={autoScan ? "Auto-scan is on \u2014 tap to switch to manual" : "Auto-scan is off \u2014 tap to enable"}
              >
                {autoScan ? <ScanLine className="h-3.5 w-3.5" /> : <Hand className="h-3.5 w-3.5" />}
                {autoScan ? "Auto-scan" : "Manual"}
              </button>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center px-8 text-white/80 text-sm flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning-600" />
              {error}
            </div>
          ) : captured ? (
            <img src={captured.url} alt="Captured label" className="w-full h-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
              {autoScan && (
                <>
                  {/* Framing guide + live status \u2014 this is the only feedback the
                      user needs; there's no button to press while this is up. */}
                  <div
                    className={`pointer-events-none absolute inset-8 rounded-2xl border-2 transition-colors ${
                      scanStatus === "holding" ? "border-accent-500" : "border-white/50"
                    }`}
                    style={{ borderStyle: "dashed" }}
                  />
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-2">
                    {scanStatus === "holding" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse" />
                    )}
                    <span className="text-white text-xs font-semibold">{statusCopy[scanStatus]}</span>
                  </div>
                </>
              )}
            </>
          )}
          {captured?.auto && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-600 text-white text-[11px] font-bold">
              <Check className="h-3 w-3" /> Auto-captured
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={sampleCanvasRef} className="hidden" />
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-4 bg-ink-900">
          {error ? (
            <button
              onClick={startStream}
              className="h-11 px-5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
            >
              Try Again
            </button>
          ) : captured ? (
            <>
              <button
                onClick={retake}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" /> Retake
              </button>
              <button
                onClick={confirm}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-success-600 text-white text-sm font-semibold hover:bg-success-700"
              >
                <Check className="h-4 w-4" /> Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
                className="h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                title="Switch camera"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => takeShot({ auto: false })}
                className="h-16 w-16 rounded-full bg-white ring-4 ring-white/30 hover:ring-white/50 transition-all"
                title={autoScan ? "Capture now (skip auto-scan)" : "Capture"}
              />
              <div className="h-11 w-11" />
            </>
          )}
        </div>
        {!error && !captured && (
          <p className="text-center text-[11px] text-white/40 pb-3 -mt-1">
            {autoScan ? "Captures automatically once the label is steady \u2014 or tap the shutter to capture now" : "Tap the shutter to capture"}
          </p>
        )}
      </div>
    </div>
  );
}
