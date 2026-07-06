"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toolsRegistry } from "@/lib/tools/registry";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowRight,
  Info,
  Search,
  HelpCircle,
  Flame,
  Star,
  Zap,
  Heart,
  ChevronRight,
  Sparkles,
  FileText,
  Image as ImageIcon,
  TrendingUp,
  Cpu,
  BarChart3,
  Video,
  Volume2,
  Users,
  Compass,
  FileUp,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

export default function ToolsListingPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Persistence for user favorites
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favorites");
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const toggleFavorite = (slug: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [slug]: !prev[slug] };
      localStorage.setItem("favorites", JSON.stringify(next));
      toast({
        title: next[slug] ? "❤️ Added to Favorites" : "💔 Removed from Favorites",
        description: `${name} has been updated in your profile preferences.`,
        type: "success",
      });
      return next;
    });
  };

  // Filter tools based on user search query and active category chip
  const filteredTools = toolsRegistry.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Support category mapping
    const matchesCategory = 
      activeCategory === "all" || 
      tool.category === activeCategory;
      
    return matchesSearch && matchesCategory;
  });

  // Category items with counts dynamically populated
  const pdfCount = toolsRegistry.filter(t => t.category === "pdf").length;
  const imageCount = toolsRegistry.filter(t => t.category === "image").length;

  const categories = [
    { id: "pdf", name: "PDF Tools", icon: FileText, count: `${pdfCount} Tools`, color: "from-cyan-500/20 to-blue-500/10 hover:border-cyan-400" },
    { id: "image", name: "Image Tools", icon: ImageIcon, count: `${imageCount} Tools`, color: "from-pink-500/20 to-rose-500/10 hover:border-pink-400" },
    { id: "ai", name: "AI Tools", icon: Cpu, count: "Coming Soon", color: "from-violet-500/20 to-purple-500/10 hover:border-violet-400" },
    { id: "seo", name: "SEO Tools", icon: BarChart3, count: "Coming Soon", color: "from-emerald-500/20 to-teal-500/10 hover:border-emerald-400" },
    { id: "social", name: "Social Media", icon: Compass, count: "Coming Soon", color: "from-sky-500/20 to-indigo-500/10 hover:border-sky-400" },
    { id: "marketing", name: "Marketing", icon: Star, count: "Coming Soon", color: "from-red-500/20 to-orange-500/10 hover:border-red-400" },
    { id: "video", name: "Video Tools", icon: Video, count: "Coming Soon", color: "from-amber-500/20 to-yellow-500/10 hover:border-amber-400" },
    { id: "audio", name: "Audio Tools", icon: Volume2, count: "Coming Soon", color: "from-fuchsia-500/20 to-pink-500/10 hover:border-fuchsia-400" },
  ];

  // Popular search recommendations list
  const popularSearches = ["PDF", "SEO", "Compress", "Background Remover", "QR Code", "AI"];

  // Helper to resolve card badges based on tool slug
  const getToolBadge = (slug: string) => {
    if (slug === "image-compress" || slug === "pdf-compress") {
      return { text: "Popular", icon: <Flame className="w-3 h-3 text-amber-500" />, bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" };
    }
    if (slug === "bg-remover" || slug === "webp-convert") {
      return { text: "Pro", icon: <Star className="w-3 h-3 text-primary" />, bg: "bg-primary/10 border-primary/25 text-primary" };
    }
    return { text: "Fast", icon: <Zap className="w-3 h-3 text-sky-500" />, bg: "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400" };
  };

  return (
    <div className="space-y-12 pb-16 bg-background text-foreground transition-colors duration-300 relative overflow-hidden select-none">
      
      {/* Decorative ambient backgrounds */}
      <div className="absolute top-[5%] right-[-10%] w-[350px] h-[350px] bg-primary/8 dark:bg-primary/4 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-blue-500/8 dark:bg-blue-500/3 rounded-full blur-[120px] pointer-events-none" />


      {/* ================= SECTION 2: SMART SEARCH & SUGGESTIONS ================= */}
      <section className="space-y-4 max-w-2xl mx-auto text-center relative z-10">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          <input
            type="text"
            placeholder="Search any tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card-bg dark:bg-[#16161A]/80 border border-border-color dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-base font-semibold text-foreground dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all placeholder-text-muted shadow-sm dark:shadow-2xl"
          />
        </div>
        
        {/* Clickable search recommendation badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-text-secondary dark:text-slate-450">
          <span>Popular Searches:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => setSearchQuery(term)}
              className="px-3 py-1 rounded-lg warm-chip-bg border border-border-color dark:border-white/5 hover:border-primary/40 hover:text-primary transition-all"
            >
              {term}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-2 py-0.5 rounded bg-primary text-white text-[10px]"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* ================= SECTION 3: CATEGORY SELECTIONS (ALTERNATING BACKGROUND TILE SHAPE) ================= */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-border-color dark:border-white/5 pb-4">
          <h3 className="text-lg font-black text-foreground dark:text-white tracking-tight uppercase">Popular Categories</h3>
          <button
            onClick={() => setActiveCategory("all")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isFilterActive = activeCategory === cat.id;
            const isClickable = cat.count !== "Coming Soon";
            
            return (
              <button
                key={cat.id}
                disabled={!isClickable}
                onClick={() => {
                  if (activeCategory === cat.id) {
                    setActiveCategory("all");
                  } else {
                    setActiveCategory(cat.id);
                    toast({
                      title: `📂 Category Filtered: ${cat.name}`,
                      description: `Showing available tools in ${cat.name}.`,
                      type: "success",
                    });
                  }
                }}
                className={`w-full p-5 rounded-2xl border text-left flex flex-col justify-between gap-6 transition-all duration-300 relative overflow-hidden group select-none shadow-sm ${
                  isFilterActive
                    ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md scale-103"
                    : isClickable
                    ? "border-border-color bg-card-bg dark:bg-white/3 dark:border-white/5 hover:border-primary/25 hover:shadow-md cursor-pointer hover:-translate-y-0.5"
                    : "border-border-color bg-secondary-bg dark:bg-black/5 dark:border-white/5 opacity-55 cursor-not-allowed"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon className="w-5 h-5 text-slate-800 dark:text-white" />
                  </div>
                  {isClickable && (
                    <span className="text-[9px] font-black uppercase tracking-wider warm-chip-bg px-2 py-0.5 rounded text-text-secondary dark:text-slate-400">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-foreground dark:text-white text-sm block">{cat.name}</span>
                  <span className="text-[10px] text-text-secondary dark:text-slate-500 font-bold block">{cat.count}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 5: PRIMARY TOOLS GRID (REDESIGNED) ================= */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-border-color dark:border-white/5 pb-4">
          <h3 className="text-lg font-black text-foreground dark:text-white tracking-tight uppercase">
            {activeCategory === "all" ? "All Platform Tools" : `Catalog: ${activeCategory.toUpperCase()}`}
          </h3>
          <span className="text-xs text-text-secondary dark:text-slate-400 font-bold">
            Showing {filteredTools.length} of {toolsRegistry.length} Tools
          </span>
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const IconComponent = (LucideIcons as any)[tool.iconName] || HelpCircle;
              const isFav = !!favorites[tool.slug];

              return (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group">
                  <GlassCard
                    hoverable={true}
                    className="h-full flex flex-col justify-between items-start gap-6 p-7 bg-white dark:bg-card-bg border border-border-color dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.04)] rounded-3xl relative overflow-hidden transition-all duration-300"
                  >
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-start w-full">
                        {/* Colorful Gradient Icon Background */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-white/5 dark:to-white/5 flex items-center justify-center text-[#BE1E2E] group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        
                        {/* Simple Clean Favorite Toggle */}
                        <button
                          onClick={(e) => toggleFavorite(tool.slug, tool.name, e)}
                          className={`p-2 rounded-xl border transition-all duration-250 ${
                            isFav
                              ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/35 text-red-500 scale-105"
                              : "bg-black/5 dark:bg-white/5 border-transparent text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? "fill-red-500" : ""}`} />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <h4 className="text-base font-extrabold text-slate-800 dark:text-white group-hover:text-[#BE1E2E] transition-colors leading-snug">
                          {tool.name}
                        </h4>
                        <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="w-full border-t border-border-color dark:border-white/5 pt-4 flex justify-between items-center text-xs font-bold text-text-muted dark:text-slate-500">
                      <span>Ready in seconds</span>
                      <span className="text-[#BE1E2E] flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300 font-bold">
                        <span>Launch Tool</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary-bg/50 dark:bg-white/2 border border-border-color dark:border-white/5 rounded-2xl w-full">
            <p className="text-text-secondary dark:text-slate-400 font-bold text-sm">No tools found matching your request.</p>
          </div>
        )}
      </section>


    </div>
  );
}
