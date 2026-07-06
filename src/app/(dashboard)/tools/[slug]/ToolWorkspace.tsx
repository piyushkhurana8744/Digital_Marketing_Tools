"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { Confetti } from "@/components/ui/Confetti";
import { GlassCard } from "@/components/ui/glass-card";
import { FileUploadArea } from "@/components/tools/FileUploadArea";
import { DynamicSettings } from "@/components/tools/DynamicSettings";
import { ImagePreview } from "@/components/tools/ImagePreview";
import { ExecutionConsole } from "@/components/tools/ExecutionConsole";
import { AuthModal } from "@/components/auth/AuthModal";
import { useUsageTracker } from "@/hooks/useUsageTracker";
import { useToolExecution } from "@/hooks/useToolExecution";
import { ToolMetadata } from "@/lib/tools/types";
import {
  ArrowLeft,
  Zap,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Lock,
  X,
  Sparkles,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

interface ToolWorkspaceProps {
  tool: ToolMetadata;
  userCredits: number;
}

export function ToolWorkspace({ tool, userCredits }: ToolWorkspaceProps) {
  const { toast } = useToast();
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Freemium usage tracking hooks
  const {
    visitorId,
    loggedIn,
    usageCount,
    maxCount,
    limitReached,
    authModalOpen,
    setAuthModalOpen,
    checkUsageLimit,
  } = useUsageTracker();

  // Initialize configuration settings
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    tool.settings.forEach((f) => {
      initial[f.name] = f.defaultValue;
    });
    return initial;
  });

  const {
    selectedFiles,
    running,
    progress,
    logs,
    result,
    error,
    handleFilesSelected,
    removeFile,
    handleExecute,
    handleDownload,
    moveFile,
  } = useToolExecution({
    tool,
    visitorId,
    limitReached,
    setAuthModalOpen,
    checkUsageLimit,
  });

  const handleSettingChange = (name: string, value: any) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const [lastResult, setLastResult] = useState<any>(null);
  const [lastError, setLastError] = useState<string>("");

  useEffect(() => {
    if (result && result !== lastResult) {
      setLastResult(result);
      setTriggerConfetti(true);
      toast({
        title: "✨ Processing Complete",
        description: `Successfully optimized ${result.outputFileName}`,
        type: "success",
      });
    }
  }, [result, lastResult, toast]);

  useEffect(() => {
    if (error && error !== lastError) {
      setLastError(error);
      toast({
        title: "⚠️ Optimization Failed",
        description: error,
        type: "error",
      });
    }
  }, [error, lastError, toast]);

  // Resolve Lucide icon
  const IconComponent = (LucideIcons as any)[tool.iconName] || LucideIcons.FileText;

  // Clear workspace to process another file
  const handleReset = () => {
    handleFilesSelected([]);
    setLastResult(null);
    setLastError("");
  };

  return (
    <div className="space-y-8 pb-10 text-left bg-background text-foreground transition-colors duration-300 relative">
      <Confetti active={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />

      {/* Auth Modal Overlay Gateway */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          window.location.reload();
        }}
        message="Free usage limit reached. Please sign in or register to get unlimited runs."
      />

      {/* Top Navigation Back Link */}
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-[#BE1E2E] transition-colors group pl-1"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Catalog</span>
      </Link>

      {/* Tool Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-border-color pb-6 pl-1">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-white/5 flex items-center justify-center border border-red-100 dark:border-white/10">
              <IconComponent className="w-6 h-6 text-[#BE1E2E]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{tool.name}</h1>
          </div>
          <p className="text-text-secondary dark:text-slate-400 text-sm max-w-2xl font-medium leading-relaxed">{tool.description}</p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          {loggedIn ? (
            <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-[#BE1E2E] flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BE1E2E] animate-pulse" />
              <span>Pro Plan</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white border border-border-color text-xs font-bold text-slate-700 shadow-sm">
              <span>Limit: {usageCount} / {maxCount} runs</span>
            </div>
          )}
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1.5">
            Cost: {tool.creditsCost} Credits
          </div>
        </div>
      </div>

      {/* Limit Reached Warning Overlay Banner */}
      {limitReached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-[#BE1E2E] text-left shadow-sm font-bold"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>DAILY LIMIT REACHED</span>
            </div>
            <p className="text-text-secondary font-semibold">You have used your free daily limit. Register an account to keep using our tools.</p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#BE1E2E] text-white font-bold hover:bg-[#A31825] transition-all text-xs shadow-md"
          >
            Sign In / Register
          </button>
        </motion.div>
      )}

      {/* Main Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Input Panel OR Satisfying Success Card */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400 pl-1">
            Workspace
          </h3>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="workspace-input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard hoverable={false} className="bg-white dark:bg-white/3 border border-border-color dark:border-white/5 p-8 space-y-6 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-3xl">
                  {/* Visual Lock Overlay if limit reached */}
                  {limitReached && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center p-6 text-center space-y-4 transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#BE1E2E]">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Limit Reached</h4>
                        <p className="text-xs text-text-secondary mt-1 max-w-xs font-medium leading-relaxed">Sign in or create a free account to continue processing your files.</p>
                      </div>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="px-6 py-3 rounded-xl bg-[#BE1E2E] hover:bg-[#A31825] text-white text-xs font-bold transition-all shadow-md"
                      >
                        Sign In / Create Account
                      </button>
                    </div>
                  )}

                  <FileUploadArea
                    acceptedExtensions={tool.acceptedFileTypes}
                    maxSize={tool.maxFileSizeBytes}
                    onFilesSelected={handleFilesSelected}
                    selectedFiles={selectedFiles}
                    removeFile={removeFile}
                    moveFile={moveFile}
                  />

                  {tool.category === "image" && selectedFiles.length > 0 && (
                    <ImagePreview
                      selectedFiles={selectedFiles}
                      toolSlug={tool.slug}
                      settings={settings}
                      accentColor="pink"
                      onSettingChange={handleSettingChange}
                    />
                  )}

                  <DynamicSettings
                    fields={tool.settings}
                    values={settings}
                    onChange={handleSettingChange}
                    accentColor="pink"
                  />

                  <button
                    onClick={() => handleExecute(settings)}
                    disabled={running || selectedFiles.length === 0 || limitReached}
                    className={`w-full py-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 hover:scale-101 ${
                      running || selectedFiles.length === 0 || limitReached
                        ? "bg-secondary-bg text-text-muted border border-border-color cursor-not-allowed"
                        : "btn-primary text-white"
                    }`}
                  >
                    {running ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#BE1E2E]" />
                        <span className="text-text-secondary">Optimizing file...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>{tool.category === "image" ? "Start Optimizing" : "Start Conversion"}</span>
                      </>
                    )}
                  </button>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="workspace-success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <GlassCard hoverable={false} className="bg-white dark:bg-white/3 border border-border-color dark:border-white/5 p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-3xl relative overflow-hidden">
                  <div className="absolute top-[-20%] left-[-20%] w-[180px] h-[180px] bg-emerald-50 dark:bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

                  <span className="text-5xl block select-none leading-none pt-2">✨</span>

                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mt-6 text-emerald-500 shadow-sm shadow-emerald-100">
                    <CheckCircle className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 mt-6">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Your file is ready.</h3>
                    <p className="text-xs text-text-secondary dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                      Successfully optimized and prepared your download.
                    </p>
                    
                    <div className="p-4 bg-[#F9FAFB] dark:bg-white/5 rounded-2xl border border-border-color dark:border-white/5 text-xs text-left max-w-sm mx-auto flex flex-col gap-1.5 mt-5">
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{result.outputFileName}</span>
                      {result.outputFileSize !== undefined && (
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          Size: {(result.outputFileSize / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-8 max-w-sm mx-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="w-full py-4 rounded-xl btn-primary text-white text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Optimized File</span>
                    </motion.button>
                    
                    <button
                      onClick={handleReset}
                      className="w-full py-3 rounded-xl border border-border-color dark:border-white/10 hover:bg-[#F9FAFB] dark:hover:bg-white/5 text-text-secondary dark:text-slate-300 text-xs font-bold transition-all"
                    >
                      Convert Another
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: n8n Workflow status builder console */}
        <div className="space-y-4">
          <ExecutionConsole
            logs={logs}
            progress={progress}
            running={running}
            accentColor="pink"
          />
        </div>
      </div>
    </div>
  );
}
