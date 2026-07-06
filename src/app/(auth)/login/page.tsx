"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Target, ShieldAlert, CheckCircle2, Chrome } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get("redirect") || "/dashboard";

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard
      hoverable={false}
      className="w-full max-w-md p-8 space-y-6 !rounded-2xl"
    >
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
        <h2 className="text-2xl font-extrabold text-foreground pt-2">Welcome Back</h2>
        <p className="text-xs text-text-muted">Sign in to access your dashboard</p>
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
          <span>Credentials verified. Redirecting...</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Authenticating..." : "Sign In with Email"}
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
        <span>Sign In with Google</span>
      </button>

      <div className="text-center text-xs text-text-muted pt-1">
        <span>Don&apos;t have an account? </span>
        <Link href="/register" className="text-primary hover:underline font-semibold">
          Create Account
        </Link>
      </div>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "var(--auth-bg-glow-a)" }} />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "var(--auth-bg-glow-b)" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 glass-panel-static rounded-2xl flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-text-muted">Initializing secure gateway...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
