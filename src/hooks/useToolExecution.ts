"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToolMetadata } from "@/lib/tools/types";

interface UseToolExecutionProps {
  tool: ToolMetadata;
  visitorId: string;
  limitReached: boolean;
  setAuthModalOpen: (open: boolean) => void;
  checkUsageLimit: () => Promise<boolean>;
}

export function useToolExecution({
  tool,
  visitorId,
  limitReached,
  setAuthModalOpen,
  checkUsageLimit,
}: UseToolExecutionProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{
    outputFileName?: string;
    outputFileSize?: number;
    downloadUrl?: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleFilesSelected = (files: File[]) => {
    setError("");
    setResult(null);
    setSelectedFiles(files);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    if (selectedFiles.length <= 1) {
      setResult(null);
    }
  };

  const handleExecute = async (settings: Record<string, unknown>) => {
    // Lock execution if usage limit reached
    if (limitReached) {
      setAuthModalOpen(true);
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please upload at least one valid file to run this tool.");
      return;
    }

    if (running) return;

    setError("");
    setRunning(true);
    setProgress(5);
    setResult(null);
    setLogs(["[SYSTEM] Initializing tool runtime...", "[SYSTEM] Verifying freemium usage bounds..."]);

    const steps = [
      `[SYSTEM] Connecting to server-side runner: ${tool.slug}`,
      `[WORKER] Uploading payload (${(selectedFiles.reduce((a, f) => a + f.size, 0) / 1024).toFixed(1)} KB)...`,
      `[WORKER] Resolving metadata configuration fields...`,
    ];

    let stepIndex = 0;
    const simInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setLogs((prev) => [...prev, steps[stepIndex]]);
        setProgress((prev) => Math.min(60, prev + 15));
        stepIndex++;
      } else {
        clearInterval(simInterval);
      }
    }, 400);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("settings", JSON.stringify(settings));

      const response = await fetch(`/api/tools/${tool.slug}`, {
        method: "POST",
        headers: {
          "x-visitor-id": visitorId, // Injected for robust fallback mapping
        },
        body: formData,
      });

      const responseData = await response.json();

      clearInterval(simInterval);

      if (!response.ok) {
        if (responseData.error === "LIMIT_REACHED") {
          setAuthModalOpen(true);
          throw new Error("Free tier usage limit reached. Please authenticate.");
        }
        throw new Error(responseData.error || "Execution failed. Please check inputs.");
      }

      setProgress(80);
      setLogs((prev) => [
        ...prev,
        ...(responseData.logs || []),
        `[SYSTEM] Syncing usage tracking database...`,
        `[SYSTEM] Run executed successfully. Output generated.`,
      ]);

      setTimeout(async () => {
        setProgress(100);
        setRunning(false);
        setResult({
          outputFileName: responseData.outputFileName,
          outputFileSize: responseData.outputFileSize,
          downloadUrl: responseData.downloadUrl,
        });
        
        // Refresh and fetch latest counts
        await checkUsageLimit();
        router.refresh();
      }, 600);

    } catch (err) {
      clearInterval(simInterval);
      setRunning(false);
      setProgress(0);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during processing.";
      setError(errMsg);
      setLogs((prev) => [...prev, `[ERROR] Processing failed: ${errMsg}`]);
    }
  };

  const handleDownload = () => {
    if (!result?.downloadUrl || !result?.outputFileName) return;

    const link = document.createElement("a");
    link.href = result.downloadUrl;
    link.download = result.outputFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const moveFile = (idx: number, direction: "up" | "down") => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      if (direction === "up" && idx > 0) {
        const temp = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = temp;
      } else if (direction === "down" && idx < next.length - 1) {
        const temp = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = temp;
      }
      return next;
    });
  };

  return {
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
  };
}
