"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  UploadCloud,
  Search,
  Cpu,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowDown,
} from "lucide-react";

interface ExecutionConsoleProps {
  logs: string[];
  progress: number;
  running: boolean;
  accentColor: "cyan" | "pink" | "emerald" | "violet";
}

export function ExecutionConsole({ logs, progress, running, accentColor }: ExecutionConsoleProps) {
  const hasError = logs.some((log) => typeof log === "string" && log.startsWith("[ERROR]"));
  const errorMessage = logs
    .find((log) => typeof log === "string" && log.startsWith("[ERROR]"))
    ?.replace("[ERROR] Processing failed: ", "")
    ?.replace("[ERROR] ", "");

  // Define steps
  const steps = [
    { id: 1, label: "File Selected", desc: "Your file is ready to process", icon: FileText },
    { id: 2, label: "Uploading", desc: "Uploading your file...", icon: UploadCloud },
    { id: 3, label: "Analyzing", desc: "Reading file structure...", icon: Search },
    { id: 4, label: "Processing", desc: "Applying optimizations...", icon: Cpu },
    { id: 5, label: "Optimizing", desc: "Optimizing size & quality...", icon: Sparkles },
    { id: 6, label: "Finished", desc: "Finished successfully", icon: CheckCircle },
  ];

  // Helper to map progress state to step status
  const getStepStatus = (stepId: number) => {
    if (progress === 0 && !running) return "pending";
    if (hasError) return "failed";

    // Finished
    if (progress === 100) return "completed";

    // Step 1: File Selected (Always done once started)
    if (stepId === 1) return "completed";

    // Step 2: Uploading (Done when progress > 20, active between 5 and 20)
    if (stepId === 2) {
      if (progress > 20) return "completed";
      if (progress >= 5) return "running";
      return "pending";
    }

    // Step 3: Analyzing (Done when progress > 35, active between 20 and 35)
    if (stepId === 3) {
      if (progress > 35) return "completed";
      if (progress >= 20) return "running";
      return "pending";
    }

    // Step 4: Processing (Done when progress > 50, active between 35 and 50)
    if (stepId === 4) {
      if (progress > 50) return "completed";
      if (progress >= 35) return "running";
      return "pending";
    }

    // Step 5: Optimizing (Done when progress > 80, active between 50 and 80)
    if (stepId === 5) {
      if (progress >= 80) return "completed";
      if (progress >= 50) return "running";
      return "pending";
    }

    // Step 6: Finished (active when progress >= 80 but not yet 100)
    if (stepId === 6) {
      if (progress === 100) return "completed";
      if (progress >= 80) return "running";
      return "pending";
    }

    return "pending";
  };

  // Get current active step descriptive text
  const getProgressMessage = () => {
    if (hasError) return "An error occurred during processing.";
    if (progress === 100) return "Finished successfully.";
    if (progress >= 80) return "Preparing download...";
    if (progress >= 50) return "Optimizing quality...";
    if (progress >= 35) return "Generating output...";
    if (progress >= 20) return "Reading file structure...";
    if (progress >= 5) return "Uploading your file...";
    return "Ready. Upload a file above to begin.";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400 text-left pl-1">
        Workflow Builder
      </h3>

      <div className="bg-white dark:bg-white/3 border border-border-color dark:border-white/5 p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-8 relative overflow-hidden">
        {/* Connection flow header status */}
        <div className="flex justify-between items-center pb-4 border-b border-border-color dark:border-white/5">
          <div className="text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted dark:text-slate-500">Current Stage</span>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{getProgressMessage()}</h4>
          </div>
          {running && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-white/5 text-[#BE1E2E] text-xs font-bold shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{progress}%</span>
            </div>
          )}
        </div>

        {/* n8n Automation Workflow Builder Area */}
        <div className="flex flex-col items-start space-y-6 relative pl-4 select-none">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === "completed";
            const isRunning = status === "running";
            const isFailed = status === "failed";
            
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative flex items-center gap-4 w-full text-left">
                {/* Vertical connection connector line */}
                {index < steps.length - 1 && (
                  <div
                    className="absolute left-6 top-12 w-0.5 h-8 transition-colors duration-300"
                    style={{
                      backgroundColor: isCompleted
                        ? "rgba(16, 185, 129, 0.4)" // Completed path: light green
                        : isRunning
                        ? "rgba(190, 30, 46, 0.2)"
                        : "rgba(229, 231, 235, 0.2)",
                    }}
                  >
                    {/* Flowing animated dash overlay inside the active line */}
                    {isRunning && (
                      <motion.div
                        className="w-full bg-[#BE1E2E]"
                        initial={{ height: "0%" }}
                        animate={{ height: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </div>
                )}

                {/* Node circle */}
                <motion.div
                  animate={isRunning ? { scale: [1, 1.08, 1], boxShadow: "0 0 15px rgba(190, 30, 46, 0.2)" } : { scale: 1 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 transition-all duration-300 z-10 ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200"
                      : isRunning
                      ? "bg-white dark:bg-white/10 border-[#BE1E2E] text-[#BE1E2E] shadow-sm shadow-red-100 dark:shadow-none"
                      : isFailed
                      ? "bg-red-500 border-red-500 text-white shadow-sm"
                      : "bg-[#F9FAFB] dark:bg-white/5 border-border-color dark:border-white/5 text-text-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                {/* Step Metadata details */}
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-bold transition-colors duration-300 ${
                      isRunning
                        ? "text-[#BE1E2E]"
                        : isCompleted
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium mt-0.5">
                    {isRunning ? step.desc : isCompleted ? "Completed successfully" : "Awaiting files"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Alert Box */}
        {hasError && errorMessage && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5 text-xs text-[#BE1E2E] items-center text-left font-bold animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Error: {errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
