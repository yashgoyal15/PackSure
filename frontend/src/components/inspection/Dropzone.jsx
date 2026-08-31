import { useCallback, useRef, useState } from "react";
import { UploadCloud, Camera, X, ImagePlus } from "lucide-react";
import CameraCapture from "./CameraCapture";

export default function Dropzone({ images, onAdd, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInput = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList).filter((f) => /image\/(jpeg|jpg|png)/.test(f.type));
      const withPreview = files.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        url: URL.createObjectURL(f),
        name: f.name,
      }));
      if (withPreview.length) onAdd(withPreview);
    },
    [onAdd]
  );

  const handleCameraCapture = useCallback(
    (file) => {
      onAdd([
        {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name,
        },
      ]);
    },
    [onAdd]
  );

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center py-14 px-6 ${
          dragOver ? "border-primary-500 bg-primary-50" : "border-ink-200 bg-ink-50/60"
        }`}
      >
        <div className="h-14 w-14 rounded-2xl bg-white border border-primary-200 flex items-center justify-center shadow-sm mb-4">
          <UploadCloud className="h-7 w-7 text-primary-600" />
        </div>
        <h3 className="font-bold text-ink-800">Drag &amp; drop a package image here</h3>
        <p className="text-sm text-ink-500 mt-1">or choose an option below &middot; JPG, JPEG, PNG &middot; max 10MB</p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <ImagePlus className="h-4 w-4" /> Browse Files
          </button>
          <button
            onClick={() => setCameraOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-white border border-primary-600 text-primary-600 text-sm font-semibold hover:bg-primary-50 transition-colors"
          >
            <Camera className="h-4 w-4" /> Use Camera
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCameraCapture} />

      {images.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink-700 mb-2.5">Attached images ({images.length})</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative h-20 w-20 rounded-xl overflow-hidden border border-ink-200 group">
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                <button
                  onClick={() => onRemove(img.id)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white/90 text-danger-600 flex items-center justify-center shadow hover:bg-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInput.current?.click()}
              className="h-20 w-20 rounded-xl border-2 border-dashed border-ink-200 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <span className="text-xs font-bold">+ Add</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
