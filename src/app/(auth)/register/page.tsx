"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Target, ShieldAlert, CheckCircle2, Chrome } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "var(--auth-bg-glow-a)" }} />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "var(--auth-bg-glow-b)" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      <GlassCard hoverable={false} className="w-full max-w-md p-8 space-y-6 !rounded-2xl relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-xl justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-foreground font-extrabold tracking-tight">
              Online<span className="text-primary">Strikers</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-foreground pt-2">Create Account</h2>
          <p className="text-xs text-text-muted">Join Online Strikers and start automating today</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl flex gap-2 text-xs text-red-600 dark:text-red-400 items-center">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex gap-2 text-xs text-emerald-600 dark:text-emerald-400 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="premium-input"
              placeholder="Alex Johnson"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="premium-input"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="premium-input"
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign Up with Email"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border-color" />
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
            or continue with
          </span>
          <div className="flex-1 h-px bg-border-color" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={() => { window.location.href = "/api/auth/google"; }}
          className="btn-secondary w-full text-sm mt-6"
        >
          <Chrome className="w-4 h-4 text-neon-cyan" />
          <span>Sign Up with Google</span>
        </button>

        <div className="text-center text-xs text-text-muted pt-1">
          <span>Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
