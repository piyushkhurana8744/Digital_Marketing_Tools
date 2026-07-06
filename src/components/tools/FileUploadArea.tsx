"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, X, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";

interface FileUploadAreaProps {
  acceptedExtensions: string[];
  maxSize: number;
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  removeFile: (index: number) => void;
  moveFile?: (index: number, direction: "up" | "down") => void;
}

export function FileUploadArea({
  acceptedExtensions,
  maxSize,
  onFilesSelected,
  selectedFiles,
  removeFile,
  moveFile,
}: FileUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | null): File[] => {
    setError("");
    if (!files) return [];
    
    const validFiles: File[] = [];
    const maxMb = (maxSize / (1024 * 1024)).toFixed(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      
      // Extension validation
      const isAllowed = acceptedExtensions.some(
        (allowed) => allowed.toLowerCase() === ext || allowed === "*"
      );
      
      if (!isAllowed) {
        setError(`File type '${ext}' is not supported. (Allowed: ${acceptedExtensions.join(", ").toUpperCase()})`);
        return [];
      }

      // Size validation
      if (file.size > maxSize) {
        setError(`File '${file.name}' exceeds the maximum allowed size of ${maxMb}MB.`);
        return [];
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = validateFiles(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const triggerInput = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5 text-xs text-[#BE1E2E] items-center text-left font-bold"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        whileHover={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)" }}
        whileTap={{ scale: 0.99 }}
        animate={
          dragActive
            ? {
                borderColor: "#BE1E2E",
                backgroundColor: "rgba(190, 30, 46, 0.04)",
                boxShadow: "0 0 25px rgba(190, 30, 46, 0.08)",
              }
            : {
                borderColor: "var(--border-color, rgba(229, 231, 235, 0.2))",
                backgroundColor: "transparent",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.01)",
              }
        }
        className="border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 relative overflow-hidden text-text-secondary bg-[#FAF9F6]/50 dark:bg-white/3 border-border-color dark:border-white/5"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={acceptedExtensions.join(",")}
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center gap-4 select-none">
          <motion.div
            animate={
              dragActive || selectedFiles.length > 0
                ? { y: [0, -8, 0] }
                : { y: 0 }
            }
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1.2,
              ease: "easeInOut",
            }}
            className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-white/5 flex items-center justify-center border border-red-100 dark:border-white/10"
          >
            <UploadCloud className="w-8 h-8 text-[#BE1E2E]" />
          </motion.div>
          <div>
            <p className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
              Your next file is just one click away.
            </p>
            <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-semibold">
              Drag & drop files here, or <span className="text-[#BE1E2E] hover:underline font-bold">browse files</span>
            </p>
            <p className="text-[10px] text-text-muted dark:text-slate-500 mt-2 font-bold uppercase tracking-wider">
              Supports {acceptedExtensions.join(", ").toUpperCase()} files up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Selected Files List */}
      <AnimatePresence mode="popLayout">
        {selectedFiles.length > 0 && (
          <div className="space-y-2 text-left">
            <label className="text-[10px] text-text-muted dark:text-slate-500 font-extrabold uppercase tracking-wider block pl-1">
              Selected Files ({selectedFiles.length})
            </label>
            <div className="space-y-2">
              {selectedFiles.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border-color dark:bg-card-bg text-xs shadow-sm hover:border-[#BE1E2E]/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#BE1E2E] shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-slate-800 dark:text-slate-200 font-bold max-w-[120px] sm:max-w-xs leading-none">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-text-muted dark:text-slate-500 font-semibold mt-1.5">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {moveFile && (
                      <div className="flex items-center gap-1 border-r border-border-color dark:border-white/5 pr-2 mr-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveFile(idx, "up");
                          }}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-secondary-bg dark:hover:bg-white/5 text-text-secondary hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveFile(idx, "down");
                          }}
                          disabled={idx === selectedFiles.length - 1}
                          className="p-1.5 rounded-lg hover:bg-secondary-bg dark:hover:bg-white/5 text-text-secondary hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-[#BE1E2E] transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
