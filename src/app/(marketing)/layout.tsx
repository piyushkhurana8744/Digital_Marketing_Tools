"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Target, Mail, Twitter, Sun, Moon } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    const root = document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 relative">
      {/* Ambient Strikers Crimson light flares */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ background: 'var(--auth-bg-glow-a)' }} />
      <div className="absolute top-[25%] right-[10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'var(--auth-bg-glow-b)' }} />

      {/* Sticky Header Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border-color backdrop-blur-xl bg-background/80 shadow-sm" style={{ borderRadius: 0 }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <Target className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-foreground font-extrabold tracking-tight">
              Online<span className="text-primary font-extrabold ml-0.5">Strikers</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-secondary">
            <Link href="/" className="hover:text-primary transition-colors relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform">Features</Link>
            <Link href="/tools" className="hover:text-primary transition-colors relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform">Tools</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border-color hover:bg-secondary-bg text-text-muted hover:text-foreground transition-all duration-200"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-slate-500" />
              )}
            </button>

            <Link href="/dashboard" className="text-sm font-bold text-text-secondary hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow z-10">{children}</main>

      {/* Footer */}
      <footer className="z-10 border-t border-border-color footer-bg py-16 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className="text-foreground font-bold">Online Strikers</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              Supercharge your daily tasks with premium PDF converters, simple image tools, and easy-to-use digital assistants.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Suite Tools</h4>
            <ul className="space-y-2.5 text-sm text-text-secondary font-semibold">
              <li><Link href="/tools" className="hover:text-primary transition-colors">PDF Tools</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">Image Tools</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">Background Remover</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">All Quick Tools</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-text-secondary font-semibold">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Newsletter</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="premium-input bg-card-bg w-full"
              />
              <button className="btn-primary">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border-color flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-text-muted">
          <p>© 2026 Online Strikers. Created for everyone who wants to do more online.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Mail className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
