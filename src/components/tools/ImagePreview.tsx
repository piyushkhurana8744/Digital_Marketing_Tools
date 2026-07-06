"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Crop,
  Maximize2,
  RefreshCw,
  Info,
  CheckCircle,
} from "lucide-react";

interface ImagePreviewProps {
  selectedFiles: File[];
  toolSlug: string;
  settings: Record<string, any>;
  accentColor?: "violet" | "cyan" | "pink" | "emerald" | "none";
  onSettingChange?: (name: string, value: any) => void;
}

export function ImagePreview({
  selectedFiles,
  toolSlug,
  settings,
  accentColor = "pink",
  onSettingChange,
}: ImagePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Responsive image rendered dimensions on screen
  const [imageRect, setImageRect] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Manual Crop Coordinates in percentage (0 to 100)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 10,
    y: 10,
    w: 80,
    h: 80,
  });

  const dragAction = useRef<{
    type: "move" | "resize";
    handle?: string;
    startX: number;
    startY: number;
    startBox: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Simulation states
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [transparentUrl, setTransparentUrl] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // View modes
  const [viewMode, setViewMode] = useState<"original" | "simulated">("simulated");

  const isCropper = toolSlug === "image-crop";

  // Keep activeIndex within bounds if selectedFiles length changes
  useEffect(() => {
    if (activeIndex >= selectedFiles.length) {
      setActiveIndex(Math.max(0, selectedFiles.length - 1));
    }
  }, [selectedFiles.length, activeIndex]);

  // Manage object URL lifecycle
  useEffect(() => {
    const file = selectedFiles[activeIndex];
    if (!file) {
      setActiveUrl("");
      setDimensions(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setActiveUrl(url);

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    // Reset viewMode when file changes
    setViewMode("simulated");

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFiles, activeIndex]);

  // Handle Window Resize to update rendered image dimensions
  useEffect(() => {
    const handleResize = () => {
      if (imgRef.current) {
        setImageRect({
          width: imgRef.current.clientWidth,
          height: imgRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Refs to prevent closure stale state and render loops
  const cropBoxRef = useRef(cropBox);
  const onSettingChangeRef = useRef(onSettingChange);

  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  useEffect(() => {
    onSettingChangeRef.current = onSettingChange;
  }, [onSettingChange]);

  const syncParentSettings = (
    box: { x: number; y: number; w: number; h: number },
    currentDims: { width: number; height: number } | null
  ) => {
    const currentOnSettingChange = onSettingChangeRef.current;
    if (isCropper && currentDims && currentOnSettingChange) {
      const cropX = Math.round((box.x / 100) * currentDims.width);
      const cropY = Math.round((box.y / 100) * currentDims.height);
      const cropWidth = Math.round((box.w / 100) * currentDims.width);
      const cropHeight = Math.round((box.h / 100) * currentDims.height);

      currentOnSettingChange("cropX", cropX);
      currentOnSettingChange("cropY", cropY);
      currentOnSettingChange("cropWidth", cropWidth);
      currentOnSettingChange("cropHeight", cropHeight);
    }
  };

  // Initialize and Center Crop Box on preset/file/dimensions change
  useEffect(() => {
    if (!dimensions || !isCropper) return;

    const preset = settings.aspectRatio || "free";
    let targetRatio = dimensions.width / dimensions.height;
    if (preset === "1:1 square") targetRatio = 1;
    else if (preset === "16:9 cinematic") targetRatio = 16 / 9;
    else if (preset === "4:3 standard") targetRatio = 4 / 3;
    else if (preset === "9:16 mobile") targetRatio = 9 / 16;

    let w = 100;
    let h = 100;

    const imgRatio = dimensions.width / dimensions.height;
    if (preset !== "free") {
      if (imgRatio > targetRatio) {
        w = (100 * targetRatio) / imgRatio;
      } else {
        h = (100 * imgRatio) / targetRatio;
      }
    } else {
      w = 90;
      h = 90;
    }

    const x = (100 - w) / 2;
    const y = (100 - h) / 2;

    const initialBox = { x, y, w, h };
    setCropBox(initialBox);
    syncParentSettings(initialBox, dimensions);
  }, [dimensions, settings.aspectRatio, activeIndex, isCropper]);

  // Pointer event handlers for draggable and resizable crop box
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: "move" | "resize",
    handle?: string
  ) => {
    e.preventDefault();
    if (!imageRect) return;

    dragAction.current = {
      type,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...cropBox },
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragAction.current || !imageRect) return;
    const { type, handle, startX, startY, startBox } = dragAction.current;

    const dx = ((e.clientX - startX) / imageRect.width) * 100;
    const dy = ((e.clientY - startY) / imageRect.height) * 100;

    setCropBox((prev) => {
      let left = startBox.x;
      let top = startBox.y;
      let right = startBox.x + startBox.w;
      let bottom = startBox.y + startBox.h;

      if (type === "move") {
        const w = startBox.w;
        const h = startBox.h;
        left = Math.max(0, Math.min(100 - w, startBox.x + dx));
        top = Math.max(0, Math.min(100 - h, startBox.y + dy));
        return { x: left, y: top, w, h };
      }

      if (type === "resize") {
        if (handle?.includes("left")) {
          left = Math.max(0, Math.min(right - 10, startBox.x + dx));
        }
        if (handle?.includes("right")) {
          right = Math.max(left + 10, Math.min(100, startBox.x + startBox.w + dx));
        }
        if (handle?.includes("top")) {
          top = Math.max(0, Math.min(bottom - 10, startBox.y + dy));
        }
        if (handle?.includes("bottom")) {
          bottom = Math.max(top + 10, Math.min(100, startBox.y + startBox.h + dy));
        }

        let w = right - left;
        let h = bottom - top;

        const preset = settings.aspectRatio || "free";
        if (preset !== "free" && dimensions) {
          let targetRatio = 1;
          if (preset === "1:1 square") targetRatio = 1;
          else if (preset === "16:9 cinematic") targetRatio = 16 / 9;
          else if (preset === "4:3 standard") targetRatio = 4 / 3;
          else if (preset === "9:16 mobile") targetRatio = 9 / 16;

          const imgRatio = dimensions.width / dimensions.height;
          h = (w * imgRatio) / targetRatio;

          if (handle?.includes("top")) {
            top = bottom - h;
            if (top < 0) {
              top = 0;
              h = bottom;
              w = (h * targetRatio) / imgRatio;
              if (handle?.includes("left")) left = right - w;
              else right = left + w;
            }
          } else {
            bottom = top + h;
            if (bottom > 100) {
              h = 100 - top;
              w = (h * targetRatio) / imgRatio;
              if (handle?.includes("left")) left = right - w;
              else right = left + w;
            }
          }
        }

        return {
          x: left,
          y: top,
          w: right - left,
          h: bottom - top,
        };
      }

      return prev;
    });
  };

  const handlePointerUp = () => {
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    dragAction.current = null;

    // Sync final crop coordinates to parent settings on drag release
    syncParentSettings(cropBoxRef.current, dimensions);
  };

  // Clean event listeners on component unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);


  // Simulation: Image Compression (image-compress & webp-convert)
  useEffect(() => {
    const file = selectedFiles[activeIndex];
    if (
      !file ||
      !activeUrl ||
      (toolSlug !== "image-compress" && toolSlug !== "webp-convert")
    ) {
      setCompressedUrl("");
      setCompressedSize(0);
      return;
    }

    const qualitySetting = Number(settings.quality) || 80;
    setLoadingPreview(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const mime = toolSlug === "webp-convert" ? "image/webp" : "image/jpeg";
        const q = qualitySetting / 100;
        const dataUrl = canvas.toDataURL(mime, q);
        setCompressedUrl(dataUrl);

        const base64Str = dataUrl.split(",")[1];
        if (base64Str) {
          const estSize = Math.round((base64Str.length * 3) / 4);
          const originalPixels = img.naturalWidth * img.naturalHeight;
          const resizedPixels = w * h;
          const scaledSize = Math.round(estSize * (originalPixels / resizedPixels));
          
          setCompressedSize(Math.min(file.size, Math.max(1024, scaledSize)));
        }
      }
      setLoadingPreview(false);
    };
    img.src = activeUrl;
  }, [activeUrl, settings.quality, toolSlug, activeIndex, selectedFiles]);

  // Simulation: Background Remover (bg-remover)
  useEffect(() => {
    const file = selectedFiles[activeIndex];
    if (!file || !activeUrl || toolSlug !== "bg-remover") {
      setTransparentUrl("");
      return;
    }

    setLoadingPreview(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          const refR = data[0];
          const refG = data[1];
          const refB = data[2];

          const threshold = 40;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist = Math.sqrt(
              Math.pow(r - refR, 2) + Math.pow(g - refG, 2) + Math.pow(b - refB, 2)
            );

            if (dist < threshold) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
          setTransparentUrl(canvas.toDataURL("image/png"));
        } catch (err) {
          console.error("Canvas read error in bg remover simulation:", err);
        }
      }
      setLoadingPreview(false);
    };
    img.src = activeUrl;
  }, [activeUrl, toolSlug, activeIndex, selectedFiles]);

  if (selectedFiles.length === 0) return null;

  const currentFile = selectedFiles[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : selectedFiles.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < selectedFiles.length - 1 ? prev + 1 : 0));
  };

  const getDisplayImageSrc = () => {
    if (viewMode === "simulated") {
      if ((toolSlug === "image-compress" || toolSlug === "webp-convert") && compressedUrl) {
        return compressedUrl;
      }
      if (toolSlug === "bg-remover" && transparentUrl) {
        return transparentUrl;
      }
    }
    return activeUrl;
  };

  const displaySrc = getDisplayImageSrc();

  const checkerboardStyle = {
    backgroundImage: `
      linear-gradient(45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.04) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.04) 75%)
    `,
    backgroundSize: "24px 24px",
    backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
    backgroundColor: "#07070a",
  };

  const isCompressionTool = toolSlug === "image-compress" || toolSlug === "webp-convert";
  const isBgRemover = toolSlug === "bg-remover";
  const isResizer = toolSlug === "image-resize";

  const compressionSavings =
    isCompressionTool && compressedSize && currentFile.size
      ? ((1 - compressedSize / currentFile.size) * 100).toFixed(1)
      : null;

  let targetWidth = Number(settings.width) || 1024;
  let targetHeight = Number(settings.height) || 768;
  if (isResizer && dimensions && settings.maintainAspectRatio !== false) {
    const ratio = dimensions.width / dimensions.height;
    if (targetWidth / targetHeight > ratio) {
      targetWidth = Math.round(targetHeight * ratio);
    } else {
      targetHeight = Math.round(targetWidth / ratio);
    }
  }

  return (
    <GlassCard hoverable={false} className="border-white/5 bg-[#0a0a0f]/40 p-5 space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className={`w-4.5 h-4.5 text-neon-${accentColor}`} />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live Assets Preview</h4>
        </div>
        
        {/* Carousel indicators */}
        {selectedFiles.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400">
              Slide {activeIndex + 1} of {selectedFiles.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Previous Slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Next Slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simulator view toggles */}
      {(isCompressionTool || isBgRemover) && (
        <div className="flex justify-between items-center bg-white/3 border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("original")}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
              viewMode === "original"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Original Image
          </button>
          <button
            onClick={() => setViewMode("simulated")}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "simulated"
                ? `bg-neon-${accentColor} text-white font-bold`
                : "text-slate-400 hover:text-white"
            }`}
          >
            {isBgRemover ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulated Transparent BG</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? "animate-spin" : ""}`} />
                <span>Simulated Output ({settings.quality}%)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Image View Sandbox */}
      <div
        style={checkerboardStyle}
        className="relative h-[260px] sm:h-[320px] rounded-xl border border-white/10 overflow-hidden flex items-center justify-center p-4 select-none"
      >
        <AnimatePresence mode="wait">
          {loadingPreview ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#07070a]/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 pointer-events-none"
            >
              <RefreshCw className={`w-6 h-6 animate-spin text-neon-${accentColor}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Applying Filters...
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {displaySrc ? (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {/* The base preview image */}
            <img
              ref={imgRef}
              src={displaySrc}
              alt={currentFile.name}
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageRect({ width: img.clientWidth, height: img.clientHeight });
              }}
              className="max-w-full max-h-[220px] sm:max-h-[280px] object-contain rounded-lg border border-white/5 shadow-2xl"
            />

            {/* CROP OVERLAY (Interactive & Draggable for image-crop) */}
            {isCropper && imageRect && (
              <div
                className="absolute"
                style={{
                  width: imageRect.width,
                  height: imageRect.height,
                  top: 0,
                  left: 0,
                }}
              >
                {/* Visual shade overlay showing outer areas (translucent backdrop) */}
                <div
                  className="absolute bg-black/65 backdrop-blur-[0.5px]"
                  style={{
                    left: 0,
                    top: 0,
                    width: `${cropBox.x}%`,
                    height: "100%",
                  }}
                />
                <div
                  className="absolute bg-black/65 backdrop-blur-[0.5px]"
                  style={{
                    left: `${cropBox.x + cropBox.w}%`,
                    top: 0,
                    width: `${100 - (cropBox.x + cropBox.w)}%`,
                    height: "100%",
                  }}
                />
                <div
                  className="absolute bg-black/65 backdrop-blur-[0.5px]"
                  style={{
                    left: `${cropBox.x}%`,
                    top: 0,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.y}%`,
                  }}
                />
                <div
                  className="absolute bg-black/65 backdrop-blur-[0.5px]"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y + cropBox.h}%`,
                    width: `${cropBox.w}%`,
                    height: `${100 - (cropBox.y + cropBox.h)}%`,
                  }}
                />

                {/* The Crop Bounding Box itself */}
                <div
                  className="absolute border border-dashed border-neon-pink shadow-[0_0_12px_rgba(236,72,153,0.4)] cursor-move select-none"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, "move")}
                >
                  {/* Outer corner marks */}
                  <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-neon-pink pointer-events-none" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-neon-pink pointer-events-none" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-neon-pink pointer-events-none" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-neon-pink pointer-events-none" />

                  {/* Corner Resize Handles */}
                  {/* Top-Left */}
                  <div
                    className="absolute -top-2 -left-2 w-4.5 h-4.5 bg-white border-2 border-neon-pink rounded-full cursor-nwse-resize z-20 hover:scale-125 transition-transform"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, "resize", "top-left");
                    }}
                  />
                  {/* Top-Right */}
                  <div
                    className="absolute -top-2 -right-2 w-4.5 h-4.5 bg-white border-2 border-neon-pink rounded-full cursor-nesw-resize z-20 hover:scale-125 transition-transform"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, "resize", "top-right");
                    }}
                  />
                  {/* Bottom-Left */}
                  <div
                    className="absolute -bottom-2 -left-2 w-4.5 h-4.5 bg-white border-2 border-neon-pink rounded-full cursor-nesw-resize z-20 hover:scale-125 transition-transform"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, "resize", "bottom-left");
                    }}
                  />
                  {/* Bottom-Right */}
                  <div
                    className="absolute -bottom-2 -right-2 w-4.5 h-4.5 bg-white border-2 border-neon-pink rounded-full cursor-nwse-resize z-20 hover:scale-125 transition-transform"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, "resize", "bottom-right");
                    }}
                  />

                  {/* Drag instructional badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-neon-pink uppercase tracking-widest flex items-center gap-1 border border-neon-pink/20 pointer-events-none">
                    <Crop className="w-2.5 h-2.5" />
                    <span>Drag Box / Corners to Crop</span>
                  </div>
                </div>
              </div>
            )}

            {/* RESIZE OVERLAY */}
            {isResizer && dimensions && (
              <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
                <div className="w-full h-full border border-dashed border-neon-cyan/40 rounded flex items-center justify-center bg-black/10">
                  <div className="px-2 py-1 rounded bg-black/80 border border-neon-cyan/20 text-[9px] font-bold text-neon-cyan uppercase tracking-wider flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3" />
                    <span>Target: {targetWidth} × {targetHeight} px</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 text-xs">
            <ImageIcon className="w-10 h-10 mx-auto opacity-30 mb-2" />
            <span>Loading assets slide...</span>
          </div>
        )}
      </div>

      {/* Info Metadata Panel */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/2 border border-white/5 text-xs text-left">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Original Specs
          </span>
          <span className="font-semibold text-slate-200 block truncate mt-0.5">
            {currentFile.name}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {dimensions ? `${dimensions.width} × ${dimensions.height}px` : "Reading bounds..."} • {(currentFile.size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="border-l border-white/5 pl-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Expected Output
          </span>
          {isCompressionTool && viewMode === "simulated" ? (
            <>
              <span className="font-bold text-neon-emerald flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3 h-3" />
                <span>~{(compressedSize / 1024).toFixed(1)} KB</span>
                {compressionSavings && Number(compressionSavings) > 0 && (
                  <span className="text-[10px] text-neon-emerald/90 bg-neon-emerald/10 px-1 py-0.2 rounded font-semibold ml-1">
                    -{compressionSavings}%
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Simulated {toolSlug === "webp-convert" ? "WebP" : "JPEG"} compaction ratio
              </span>
            </>
          ) : isResizer && dimensions ? (
            <>
              <span className="font-semibold text-neon-cyan block mt-0.5">
                {targetWidth} × {targetHeight} px
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Scaling: {((targetWidth / dimensions.width) * 100).toFixed(0)}% dimensions
              </span>
            </>
          ) : isBgRemover && viewMode === "simulated" ? (
            <>
              <span className="font-semibold text-neon-pink block mt-0.5">
                Transparent PNG
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                <span>Backdrop removed (tolerance: 40)</span>
              </span>
            </>
          ) : isCropper && dimensions ? (
            <>
              <span className="font-semibold text-neon-pink block mt-0.5">
                Manual Crop Selection
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Size: {Math.round((cropBox.w / 100) * dimensions.width)} × {Math.round((cropBox.h / 100) * dimensions.height)} px
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-300 block mt-0.5">
                Ready to Process
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Click execute tool run to begin
              </span>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
