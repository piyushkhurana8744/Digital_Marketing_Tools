import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import ConversionLog from "@/lib/models/ConversionLog";
import SavedFile from "@/lib/models/SavedFile";
import { GlassCard } from "@/components/ui/glass-card";
import {
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Info,
  History,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

export const metadata = {
  title: "Online Strikers - Workspace Dashboard",
  description: "Monitor your operations, file history, and account activity.",
};

export default async function DashboardPage(
  props: { searchParams: Promise<{ error?: string }> }
) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  const userCredits = user && (user as any).credits !== undefined ? (user as any).credits : 4821;

  await connectToDatabase();

  // Query actual conversion logs from MongoDB for this authenticated user
  const dbLogs = user
    ? await ConversionLog.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    : [];

  // Query saved files output data for this logged-in user
  const savedFiles = user
    ? await SavedFile.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    : [];

  const totalConversions = user
    ? await ConversionLog.countDocuments({ userId: user.id })
        .sort({ createdAt: -1 })
    : 0;

  let creditsUsedSum = 0;
  if (user) {
    try {
      const mongoose = await import("mongoose");
      const aggregateResult = await ConversionLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
        { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
      ]);
      creditsUsedSum = aggregateResult.length > 0 ? aggregateResult[0].total : 0;
    } catch (e) {
      console.error("Aggregation error:", e);
    }
  }

  const stats = [
    {
      label: "Runs Remaining",
      value: user ? `${userCredits.toLocaleString()} / 5,000` : "4,821 / 5,000",
      change: "Pro Premium Plan",
      progress: user ? (userCredits / 5000) * 100 : 96.4,
    },
    {
      label: "Total Operations",
      value: `${totalConversions || 14} runs`,
      change: "All completed tasks",
      progress: null,
    },
    {
      label: "Used This Month",
      value: `${creditsUsedSum || 179} runs`,
      change: "Used operations",
      progress: null,
    },
  ];

  const quickTools = [
    { name: "Bulk Compress Images", slug: "image-compress", icon: "ChevronsDownUp", color: "pink", time: "~2s run time" },
    { name: "Background Remover", slug: "bg-remover", icon: "Sparkles", color: "pink", time: "~4s run time" },
    { name: "Merge PDF Docs", slug: "pdf-merge", icon: "FolderPlus", color: "cyan", time: "~3s run time" },
    { name: "JPG to PDF Convert", slug: "jpg-to-pdf", icon: "FileCode", color: "cyan", time: "~2s run time" },
  ];

  return (
    <div className="space-y-8 pb-10 text-left bg-background text-foreground transition-colors duration-300">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Overview</h1>
          <p className="text-text-secondary dark:text-slate-400 text-sm mt-1 font-semibold">
            Monitor your file conversions, history, and downloads.
          </p>
        </div>

        <Link
          href="/tools"
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-all text-xs flex items-center gap-2 shadow-[0_4px_12px_rgba(201,36,58,0.25)] hover:-translate-y-0.5"
        >
          <span>Open All Tools</span>
          <Play className="w-3.5 h-3.5 fill-white text-white" />
        </Link>
      </div>

      {searchParams?.error === "unauthorized" && (
        <div className="p-4 bg-[#BE1E2E]/10 border border-[#BE1E2E]/25 rounded-2xl flex gap-2.5 text-xs text-[#BE1E2E] items-center font-bold">
          <LucideIcons.ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Access Denied. Administrator role privileges are required to enter the Admin Panel.</span>
        </div>
      )}

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <GlassCard
            key={stat.label}
            hoverable={false}
            className="bg-card-bg border-border-color dark:bg-[#16161A]/50 dark:border-white/5 shadow-sm dark:shadow-md space-y-4"
          >
            <div className="flex justify-between items-start select-none">
              <span className="text-[10px] text-text-muted dark:text-slate-400 font-extrabold uppercase tracking-wider">{stat.label}</span>
              <span className="text-[10px] font-bold text-text-secondary dark:text-slate-500">{stat.change}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-[#BE1E2E] tracking-tight">{stat.value}</h3>
              {stat.progress !== null && (
                <div className="w-full h-1.5 rounded-full bg-secondary-bg dark:bg-white/5 overflow-hidden border border-border-color/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#BE1E2E] to-rose-600 rounded-full"
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Primary Panels split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Tools Column */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground dark:text-white">Quick Action Tools</h3>
            <div className="grid grid-cols-1 gap-3.5">
              {quickTools.map((qt) => {
                const IconComponent = (LucideIcons as any)[qt.icon] || FileText;
                return (
                  <Link key={qt.slug} href={`/tools/${qt.slug}`}>
                    <GlassCard
                      glowColor="none"
                      className="flex items-center justify-between p-4 bg-card-bg border-border-color dark:bg-[#16161A]/50 dark:border-white/5 hover:border-[#BE1E2E]/25 transition-all text-left group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-secondary-bg dark:bg-white/5 border border-border-color dark:border-white/10 flex items-center justify-center group-hover:bg-[#BE1E2E] group-hover:text-white transition-all">
                          <IconComponent className="w-4.5 h-4.5 text-text-secondary dark:text-slate-350 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-[#BE1E2E] dark:group-hover:text-white transition-colors">{qt.name}</span>
                          <span className="text-[9px] text-text-muted dark:text-slate-500 font-semibold">{qt.time}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:translate-x-1 transition-transform" />
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logs & Saved Files Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Saved Files Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground dark:text-white">
              <FolderOpen className="w-5 h-5 text-[#BE1E2E]" />
              <h3 className="text-lg font-bold">Saved Files</h3>
            </div>
            
            <GlassCard
              hoverable={false}
              className="p-0 overflow-hidden bg-card-bg border-border-color dark:bg-[#16161A]/50 dark:border-white/5 shadow-md dark:shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-color dark:border-white/5 text-text-secondary dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-secondary-bg dark:bg-[#1A1A20]/80 select-none">
                      <th className="py-3.5 px-4 text-left">Your File</th>
                      <th className="py-3.5 px-4 text-left">Tool Used</th>
                      <th className="py-3.5 px-4 text-left">Size</th>
                      <th className="py-3.5 px-4 text-left">Download Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color dark:divide-white/5">
                    {savedFiles.length > 0 ? (
                      savedFiles.map((file) => (
                        <tr key={file._id.toString()} className="hover:bg-secondary-bg dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                            {file.fileName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[9px] font-bold text-[#BE1E2E] bg-[#BE1E2E]/10 border border-[#BE1E2E]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                              {file.toolSlug}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-text-secondary dark:text-slate-400">
                            {(file.fileSize / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-3.5 px-4">
                            <a
                              href={file.downloadUrl}
                              download={file.fileName}
                              className="inline-flex items-center gap-1.5 text-xs text-[#BE1E2E] hover:underline font-bold"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-text-muted text-xs font-semibold">
                          <Info className="w-4 h-4 mx-auto mb-2 text-text-muted" />
                          <span>
                            {user
                              ? "You haven't saved any files yet. Try out a tool to see your files here!"
                              : "Anonymous runs are not stored. Register an account to save files!"}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* Recent Audit Logs Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground dark:text-white">
              <History className="w-5 h-5 text-text-muted" />
              <h3 className="text-lg font-bold">Recent Operations</h3>
            </div>
            
            <GlassCard
              hoverable={false}
              className="p-0 overflow-hidden bg-card-bg border-border-color dark:bg-[#16161A]/50 dark:border-white/5 shadow-md dark:shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-color dark:border-white/5 text-text-secondary dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-secondary-bg dark:bg-[#1A1A20]/80 select-none">
                      <th className="py-3.5 px-4 text-left">Your File</th>
                      <th className="py-3.5 px-4 text-left">Tool Used</th>
                      <th className="py-3.5 px-4 text-left">Runs Used</th>
                      <th className="py-3.5 px-4 text-left">Status</th>
                      <th className="py-3.5 px-4 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color dark:divide-white/5">
                    {dbLogs.length > 0 ? (
                      dbLogs.map((log) => (
                        <tr key={log._id.toString()} className="hover:bg-secondary-bg dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-text-secondary dark:text-slate-400 font-semibold truncate max-w-[120px]">
                            {log.inputFileName}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {log.toolSlug}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-text-secondary dark:text-slate-400">
                            {log.creditsUsed} runs
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 text-xs font-bold">
                              {log.status === "completed" && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Success</span>
                                </span>
                              )}
                              {log.status === "failed" && (
                                <span className="inline-flex items-center gap-1 text-[#BE1E2E] bg-red-500/10 px-2 py-0.5 rounded text-[10px]">
                                  <XCircle className="w-3 h-3 text-[#BE1E2E]" />
                                  <span>Failed</span>
                                </span>
                              )}
                              {log.status === "processing" && (
                                <span className="inline-flex items-center gap-1 text-sky-655 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-[10px] animate-pulse">
                                  <Clock className="w-3 h-3 text-sky-500" />
                                  <span>Running</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-text-muted dark:text-slate-500 font-medium">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-text-muted text-xs font-semibold">
                          <Info className="w-4 h-4 mx-auto mb-2 text-text-muted" />
                          <span>No recent operations. Start using the tools to see your history here.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
}
