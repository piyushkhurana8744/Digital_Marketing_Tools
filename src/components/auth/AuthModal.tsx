"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { X, Target, ShieldAlert, CheckCircle2, Chrome, Mail, Lock, User as UserIcon } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
}

export function AuthModal({ isOpen, onClose, onSuccess, message }: AuthModalProps) {
  const [isLoginState, setIsLoginState] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLoginState ? "/api/auth/login" : "/api/auth/register";
    const body = isLoginState ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed.");

      setSuccess(true);
      
      if (isLoginState) {
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1200);
      } else {
        // Registered successfully, swap to login layout and request password entry
        setTimeout(() => {
          setSuccess(false);
          setIsLoginState(true);
          setLoading(false);
          setPassword("");
          setError("Account created. Please enter your password to sign in.");
        }, 1500);
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 dark:bg-[#0F0F10]/80 backdrop-blur-sm transition-all duration-300">
      <GlassCard
        hoverable={false}
        className="w-full max-w-md p-8 border border-border-color dark:border-white/10 relative bg-white dark:bg-[#121215] text-left shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-3xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:bg-secondary-bg dark:hover:bg-white/5 transition-colors"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2.5 font-bold text-lg justify-center select-none">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-white/5 flex items-center justify-center text-[#BE1E2E] border border-red-100 dark:border-white/10 shadow-sm">
              <Target className="w-4.5 h-4.5" />
            </div>
            <span className="text-foreground dark:text-white font-extrabold tracking-tight">
              Online<span className="text-primary font-black ml-0.5">Strikers</span>
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {isLoginState ? "Sign In Required" : "Create Free Account"}
          </h2>
          <p className="text-xs text-text-secondary dark:text-slate-400 font-semibold leading-relaxed">
            {message || (isLoginState ? "Please authenticate to unlock unlimited runs." : "Create account to save histories & file listings.")}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-xs text-[#BE1E2E] items-center mb-4 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2 text-xs text-emerald-600 items-center mb-4 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{isLoginState ? "Access authorized! Loading workspace..." : "Account created successfully!"}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginState && (
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-text-muted dark:text-slate-500 font-bold uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-white/5 border border-border-color dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder-text-muted"
                  placeholder="Alex Mercer"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] text-text-muted dark:text-slate-500 font-bold uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white dark:bg-white/5 border border-border-color dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder-text-muted"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] text-text-muted dark:text-slate-500 font-bold uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white dark:bg-white/5 border border-border-color dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder-text-muted"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Authenticating..." : isLoginState ? "Sign In" : "Register Account"}
          </button>
        </form>

        <div className="relative border-b border-border-color dark:border-white/5 my-5">
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#121215] px-3 text-[9px] uppercase font-bold text-text-muted">
            or continue with
          </span>
        </div>

        {/* Google OAuth Connector */}
        <button
          onClick={handleGoogleAuth}
          className="w-full py-3.5 rounded-xl bg-white dark:bg-white/5 hover:bg-secondary-bg dark:hover:bg-white/10 border border-border-color dark:border-white/10 text-foreground dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Chrome className="w-4 h-4 text-neon-cyan shrink-0" />
          <span>Sign In with Google</span>
        </button>

        {/* Toggle Account States */}
        <div className="text-center text-xs text-text-secondary dark:text-slate-400 pt-4 border-t border-border-color dark:border-white/5 mt-5">
          <span>{isLoginState ? "Don't have an account? " : "Already registered? "}</span>
          <button
            onClick={() => {
              setIsLoginState(!isLoginState);
              setError("");
            }}
            className="text-primary hover:underline font-bold"
          >
            {isLoginState ? "Create Free Account" : "Sign In"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
