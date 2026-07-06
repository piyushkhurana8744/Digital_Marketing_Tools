import React from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { ShieldAlert, Users, Server, Database, Activity, Terminal } from "lucide-react";

export const metadata = {
  title: "Admin Portal - DigiTools AI",
  description: "Administrative control panel, host metrics, and user management audit logs.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Defense-in-depth secure checking (complementing the middleware)
  if (!user || user.role !== "admin") {
    redirect("/dashboard?error=unauthorized");
  }

  const metrics = [
    { label: "Active Connections", value: "1,248 Users", icon: Users, color: "cyan" },
    { label: "Server Load", value: "24.2%", icon: Server, color: "violet" },
    { label: "Database Hits", value: "142 req/s", icon: Database, color: "emerald" },
    { label: "API Success Rate", value: "99.98%", icon: Activity, color: "pink" },
  ];

  const auditLogs = [
    { action: "User Role Update", user: "piyush@example.com", details: "Swapped role 'user' -> 'admin'", status: "success", time: "5m ago" },
    { action: "Google OAuth Callback", user: "johndoe@gmail.com", details: "New signup registered via Google", status: "success", time: "18m ago" },
    { action: "Register Rate Limit Hit", user: "182.16.82.9", details: "Blocked registration flood (5 requests/hr)", status: "blocked", time: "42m ago" },
    { action: "Session Revoked", user: "unknown_device", details: "Rotated token reuse detected, user sessions invalidated", status: "revoked", time: "2h ago" },
  ];

  return (
    <div className="space-y-8 pb-10 text-left">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-neon-pink" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Admin Control Portal</h1>
          <p className="text-slate-400 text-sm mt-0.5">Secure system logs, cluster telemetry, and global RBAC auditing.</p>
        </div>
      </div>

      {/* Cluster Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <GlassCard key={metric.label} hoverable={false} className="border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{metric.label}</span>
                <Icon className={`w-4 h-4 text-neon-${metric.color}`} />
              </div>
              <h3 className="text-2xl font-extrabold text-white">{metric.value}</h3>
            </GlassCard>
          );
        })}
      </div>

      {/* Audit Logs & Host Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Activity */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white">Security & Audit Logs</h3>
          <GlassCard hoverable={false} className="border-white/5 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold text-xs uppercase tracking-wider bg-white/2">
                    <th className="py-3 px-4 text-left">Log Action</th>
                    <th className="py-3 px-4 text-left">Initiator</th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th className="py-3 px-4 text-left">Audit</th>
                    <th className="py-3 px-4 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-300">{log.action}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{log.user}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{log.details}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            log.status === "success"
                              ? "bg-neon-emerald/10 border border-neon-emerald/20 text-neon-emerald"
                              : log.status === "blocked"
                              ? "bg-neon-pink/10 border border-neon-pink/20 text-neon-pink"
                              : "bg-neon-violet/10 border border-neon-violet/20 text-neon-violet"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Console logs / quick options */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">System Diagnostics</h3>
          <GlassCard hoverable={false} className="border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Cluster Status</span>
            </div>
            
            <div className="font-mono text-[10px] text-slate-400 p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
              <p className="text-neon-emerald">&gt; DB connected to cluster digitools_ai</p>
              <p className="text-slate-500">2026-06-23T18:07:11Z - Heartbeat OK</p>
              <p className="text-neon-cyan">&gt; Session rotation listener spawned</p>
              <p className="text-slate-500">2026-06-23T18:07:11Z - Cache loaded (0 entries)</p>
              <p className="text-neon-violet">&gt; Rate limit TTL cleanup executed</p>
              <p className="text-slate-500">2026-06-23T18:07:12Z - Done: purged 0 items</p>
            </div>

            <div className="p-4 bg-neon-cyan/5 rounded-xl border border-neon-cyan/20 text-xs text-slate-300">
              <p className="font-semibold text-white">Enterprise Architecture</p>
              <p className="mt-1">This panel is protected by double-tier check: Middleware validation at router boundaries, and Database-backed schema assertion in page load DAL triggers.</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
