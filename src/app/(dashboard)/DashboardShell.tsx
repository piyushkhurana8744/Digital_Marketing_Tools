"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  LayoutDashboard,
  Hammer,
  CreditCard,
  LogOut,
  ChevronDown,
  Bell,
  Sparkles,
  ShieldAlert,
  User as UserIcon,
  Sun,
  Moon,
  Heart,
  Clock,
  HelpCircle,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { UserDTO } from "@/lib/auth/dal";

interface DashboardShellProps {
  children: React.ReactNode;
  user: UserDTO | null;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [currentWorkspace] = useState("Pro Premium");
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-primary" },
    { name: "All Tools", href: "/tools", icon: Hammer, color: "text-sky-500" },
    { name: "Pricing", href: "/pricing", icon: CreditCard, color: "text-emerald-500" },
  ];

  const collectionItems = [
    { name: "Recently Used", href: "/dashboard?tab=recent", icon: Clock, color: "text-amber-500" },
    { name: "Favorites", href: "/dashboard?tab=favorites", icon: Heart, color: "text-rose-500" },
  ];

  const preferenceItems = [
    { name: "Help Center", href: "#", icon: HelpCircle, color: "text-violet-500" },
    { name: "My Profile", href: "/dashboard/profile", icon: UserIcon, color: "text-blue-500" },
  ];

  if (user?.role === "admin") {
    preferenceItems.unshift({
      name: "Management Console",
      href: "/dashboard/admin",
      icon: ShieldAlert,
      color: "text-rose-500",
    });
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PK";

  return (
    <div className="min-h-screen flex bg-secondary-bg dark:bg-[#0D0D10] text-foreground transition-colors duration-300 relative overflow-hidden p-0 md:p-4">
      {/* Decorative ambient flares */}
      <div className="absolute top-[25%] left-[-10%] w-[400px] h-[400px] bg-primary/8 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-amber-600/6 dark:bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar navigation (Desktop) */}
      <aside
        className={`glass-panel border-border-color dark:border-white/5 flex flex-col hidden lg:flex z-20 bg-gradient-to-b from-white to-[#FAF7F3] dark:from-[#121214]/90 dark:to-[#121214]/90 backdrop-blur-xl transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 border-b border-border-color dark:border-white/5 flex items-center px-4 justify-between bg-[#F5F2ED]/60 dark:bg-black/10 rounded-t-[20px]">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Target className="w-4.5 h-4.5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-foreground font-extrabold tracking-tight whitespace-nowrap">
                Online<span className="text-primary font-black">Strikers</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg text-text-muted hover:text-foreground hover:bg-secondary-bg dark:hover:bg-white/5 transition-all"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto select-none">
          {/* Main items */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="px-3 text-[9px] font-black text-text-muted dark:text-slate-500 uppercase tracking-widest block mb-2">Workspace</span>
            )}
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all border ${
                    isActive
                      ? "bg-primary/8 text-primary dark:text-white border-primary/20 shadow-[0_2px_8px_rgba(225,29,72,0.08)]"
                      : "text-text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-primary" : item.color}`} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Collections */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="px-3 text-[9px] font-black text-text-muted dark:text-slate-500 uppercase tracking-widest block mb-2">Collections</span>
            )}
            {collectionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent transition-all"
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${item.color} hover:scale-110 transition-transform`} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Preferences */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="px-3 text-[9px] font-black text-text-muted dark:text-slate-500 uppercase tracking-widest block mb-2">Preferences</span>
            )}
            {preferenceItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all border ${
                    isActive
                      ? "bg-primary/8 text-primary dark:text-white border-primary/20 shadow-sm"
                      : "text-text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-primary" : item.color}`} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border-color dark:border-white/5 bg-secondary-bg/30 dark:bg-black/5 rounded-b-[20px]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-text-secondary dark:text-slate-400 hover:text-primary hover:bg-primary-light transition-all text-left"
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4.5 h-4.5 text-primary shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Container pane */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 w-full lg:px-4">
        {/* Floating Top Nav header */}
        <header className="h-16 border border-border-color dark:border-white/5 rounded-2xl bg-white/85 dark:bg-[#121214]/85 backdrop-blur-xl flex items-center justify-between px-6 shadow-[0_2px_12px_rgba(120,100,80,0.06)] dark:shadow-sm transition-all duration-300">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-border-color dark:border-white/5 text-text-secondary hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Workspace details badge */}
            <div className="relative select-none">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary-bg dark:bg-white/5 border border-border-color dark:border-white/5 text-xs font-bold text-foreground dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{currentWorkspace}</span>
                <ChevronDown className="w-3 h-3 text-text-muted" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Run balance indicator */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-text-secondary dark:text-slate-400">Runs left:</span>
              <span className="text-primary font-black">{user ? `${(user as any).credits || 4821} / 5,000` : "4,821 / 5,000"}</span>
            </div>

            {/* Theme selector */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-border-color dark:border-white/5 hover:bg-secondary-bg dark:hover:bg-white/5 text-text-muted dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-all duration-200"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-text-secondary" />}
            </button>

            {/* Notification triggers */}
            <button className="relative p-2 rounded-xl border border-border-color dark:border-white/5 hover:bg-secondary-bg dark:hover:bg-white/5 text-text-secondary dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group">
              <Bell className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            </button>

            {/* Profile badge avatar dropdown link */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity border-l border-border-color dark:border-l-white/5 pl-4"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-border-color object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary border border-primary/20 flex items-center justify-center font-bold text-xs text-white shadow-md">
                  {initials}
                </div>
              )}
              <span className="text-xs font-bold text-foreground dark:text-slate-200 hidden md:inline-block">{user?.name || "Premium User"}</span>
            </Link>
          </div>
        </header>

        {/* Content panel */}
        <main className="flex-grow py-8 overflow-y-auto w-full mx-auto relative">
          {pathname.startsWith("/dashboard") && new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("error") === "unauthorized" && (
            <div className="mb-6 p-4 bg-primary-light border border-primary/20 rounded-2xl flex gap-2.5 text-xs text-primary items-center font-bold shadow-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Permission denied. Admin privileges are required to access that directory.</span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-72 bg-white dark:bg-[#121214] h-full flex flex-col p-6 shadow-2xl z-10 border-r border-border-color dark:border-white/5"
            >
              <div className="flex items-center justify-between pb-6 border-b border-border-color dark:border-white/5 mb-6">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-bold text-lg group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#BE1E2E] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Target className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-foreground font-extrabold tracking-tight">
                    Online<span className="text-primary font-black">Strikers</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:bg-secondary-bg dark:hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                  <span className="px-3 text-[9px] font-black text-text-muted dark:text-slate-500 uppercase tracking-widest block mb-2">Workspace</span>
                  {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all border ${
                          isActive
                            ? "bg-primary/8 text-primary dark:text-white border-primary/20"
                            : "text-text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#BE1E2E]" : item.color}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="px-3 text-[9px] font-black text-text-muted dark:text-slate-500 uppercase tracking-widest block mb-2">Collections</span>
                  {collectionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent transition-all"
                      >
                        <Icon className={`w-4.5 h-4.5 ${item.color}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="px-3 text-[9px] font-black text-text-muted dark:text-slate-500 uppercase tracking-widest block mb-2">Preferences</span>
                  {preferenceItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all border ${
                          isActive
                            ? "bg-primary/8 text-primary dark:text-white border-primary/20"
                            : "text-text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#BE1E2E]" : item.color}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border-color dark:border-white/5 mt-auto">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-text-secondary hover:text-[#BE1E2E] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
                >
                  <LogOut className="w-4.5 h-4.5 text-[#BE1E2E]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
