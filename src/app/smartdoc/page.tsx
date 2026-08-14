"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download, RotateCcw, CheckCircle, AlertTriangle } from "lucide-react";

const TARGET_WIDTH = 200;
const TARGET_HEIGHT = 230;
const MAX_SIZE_KB = 50;

interface ProcessedImage {
  dataUrl: string;
  sizeKB: number;
  width: number;
  height: number;
}

export default function SmartDocPage() {
  const [original, setOriginal] = useState<{ dataUrl: string; sizeKB: number; width: number; height: number } | null>(null);
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    setError(null);
    setProcessed(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setOriginal({ dataUrl, sizeKB: file.size / 1024, width: img.width, height: img.height });
        processImage(dataUrl, img);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  function processImage(dataUrl: string, img: HTMLImageElement) {
    setProcessing(true);
    const canvas = document.createElement("canvas");
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext("2d")!;

    // Cover crop: center the image
    const srcAspect = img.width / img.height;
    const dstAspect = TARGET_WIDTH / TARGET_HEIGHT;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (srcAspect > dstAspect) {
      sw = img.height * dstAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / dstAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    // Start with quality 0.9 and reduce until under MAX_SIZE_KB
    let quality = 0.92;
    let resultDataUrl = canvas.toDataURL("image/jpeg", quality);
    let sizeKB = (resultDataUrl.length * 3) / 4 / 1024;

    while (sizeKB > MAX_SIZE_KB && quality > 0.1) {
      quality -= 0.05;
      resultDataUrl = canvas.toDataURL("image/jpeg", quality);
      sizeKB = (resultDataUrl.length * 3) / 4 / 1024;
    }

    setProcessed({
      dataUrl: resultDataUrl,
      sizeKB: Math.round(sizeKB * 10) / 10,
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
    });
    setProcessing(false);
  }

  function handleDownload() {
    if (!processed) return;
    const a = document.createElement("a");
    a.href = processed.dataUrl;
    a.download = "passport_photo_200x230.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleReset() {
    setOriginal(null);
    setProcessed(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const isValid = processed && processed.sizeKB <= MAX_SIZE_KB;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">SmartDoc Studio</h1>
        <p className="text-sm text-muted-foreground">
          Prepare your passport photo to exact government specifications — entirely in your browser.
          Target: <strong>200×230px</strong>, under <strong>50KB</strong>.
        </p>
      </div>

      {/* Upload Area */}
      {!original && (
        <div
          className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
          }}
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <div className="font-semibold mb-1">Upload your photo</div>
            <div className="text-sm text-muted-foreground">Click to browse or drag & drop</div>
            <div className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP supported</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Before / After Comparison */}
      {original && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* BEFORE */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">BEFORE</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={original.dataUrl} alt="Original" className="w-full max-h-64 object-contain rounded-xl border bg-muted" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{original.sizeKB.toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span className="font-medium">{original.width} × {original.height}</span>
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">AFTER</div>
              {processing ? (
                <div className="w-full h-48 rounded-xl border bg-muted flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : processed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={processed.dataUrl} alt="Processed" className="w-full max-h-64 object-contain rounded-xl border bg-muted" />
              ) : null}
              {processed && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className={`font-medium ${processed.sizeKB > MAX_SIZE_KB ? "text-red-600" : "text-green-600"}`}>
                      {processed.sizeKB} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-medium text-green-600">{processed.width} × {processed.height}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation */}
          {processed && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${isValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {isValid ? (
                <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
              )}
              <div>
                <div className={`font-semibold ${isValid ? "text-green-800" : "text-red-800"}`}>
                  {isValid ? "✓ Valid — Ready for submission" : "Image still exceeds 50KB"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {processed.width}×{processed.height}px • {processed.sizeKB} KB
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isValid && (
              <button onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                <Download className="h-4 w-4" /> Download Photo
              </button>
            )}
            <button onClick={handleReset}
              className={`flex items-center justify-center gap-2 h-12 px-5 rounded-full border font-medium hover:bg-muted transition-colors ${isValid ? "" : "flex-1"}`}>
              <RotateCcw className="h-4 w-4" /> {isValid ? "New Photo" : "Try Another"}
            </button>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="mt-8 p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground">
        <strong className="text-foreground block mb-1">How it works</strong>
        Your image is processed entirely in your browser using HTML5 Canvas.
        Nothing is uploaded to any server. The result is a JPEG cropped to exactly 200×230px
        and compressed below 50KB — the most common government portal requirements.
      </div>
    </div>
  );
}
