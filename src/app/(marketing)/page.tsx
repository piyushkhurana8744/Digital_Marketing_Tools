"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { Confetti } from "@/components/ui/Confetti";
import { GlassCard } from "@/components/ui/glass-card";
import {
  FileText,
  Image as ImageIcon,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Star,
  Users,
  Compass,
  Heart,
  Upload,
  BarChart3,
  Layers,
  FileUp,
  Files,
  Cpu,
  Flame,
  Globe,
  Share2,
  FileEdit,
  QrCode,
  FileSpreadsheet,
} from "lucide-react";

export default function LandingPage() {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  
  // Interactive favorites tracking
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  
  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFavorite = (toolKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = { ...prev, [toolKey]: !prev[toolKey] };
      toast({
        title: next[toolKey] ? "❤️ Added to Favorites" : "💔 Removed from Favorites",
        description: `${toolKey} has been updated in your profile preferences.`,
        type: "success",
      });
      return next;
    });
  };

  const startUploadSim = () => {
    if (uploadState !== "idle") return;
    setUploadState("uploading");
    setProgress(5);
    
    let current = 5;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setUploadState("done");
          setConfettiActive(true);
          toast({
            title: "✨ Optimization Complete",
            description: "File size reduced by 74% (3.4 MB → 884 KB)",
            type: "success",
          });
        }, 300);
      } else {
        setProgress(current);
      }
    }, 120);
  };

  const resetUploadSim = () => {
    setUploadState("idle");
    setProgress(0);
    setConfettiActive(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
  } as const;

  const toolCategories = [
    { name: "PDF Tools", count: "12 Tools", icon: FileText, slug: "/tools?cat=pdf", badge: "Popular", img: "/pdf_tools_3d.png" },
    { name: "Image Tools", count: "8 Tools", icon: ImageIcon, slug: "/tools?cat=image", badge: "New", img: "/image_tools_3d.png" },
    { name: "SEO Tools", count: "Coming Soon", icon: BarChart3, slug: "#", badge: "", img: "/seo_tools_3d.png" },
    { name: "Marketing Tools", count: "Coming Soon", icon: Star, slug: "#", badge: "", img: "/hero_workspace_clay.png" },
    { name: "Social Media", count: "Coming Soon", icon: Compass, slug: "#", badge: "", img: "/hero_workspace_clay.png" },
    { name: "AI Tools", count: "Coming Soon", icon: Cpu, slug: "#", badge: "", img: "/hero_workspace_clay.png" },
  ];

  const testimonials = [
    {
      quote: "This is the most beautiful tools website I have ever used. Online Strikers is incredibly fast and simple to navigate.",
      author: "Marcus A.",
      role: "School Teacher",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    },
    {
      quote: "No weird ads, no confusing buttons. Just select a tool, upload your file, and get your work done.",
      author: "Sarah J.",
      role: "Shop Owner",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    },
  ] as const;

  const faqs = [
    {
      question: "How does the free limit work?",
      answer: "Every visitor gets 3 free file operations daily. Setting up a free account increases your daily limit so you can convert more files.",
    },
    {
      question: "Are my uploaded documents and photos safe?",
      answer: "Absolutely. Your files are fully encrypted while processing and automatically deleted from our servers immediately after you download them. We never keep your documents.",
    },
    {
      question: "Can I download my processed files again later?",
      answer: "If you are logged into your dashboard, your file history is securely saved for up to 30 days. Guest file downloads expire after 1 hour.",
    },
  ] as const;

  // Carousel definition
  const slides = [
    {
      title: "Futuristic PDF Workspace",
      desc: "Convert, Compress, and Merge documents in one click.",
      image: "/pdf_tools_3d.png",
      badge: "PDF Tools",
      features: ["Merge PDF Documents", "Compress File Weights", "Convert Page Formats"],
      icon: FileText,
    },
    {
      title: "Image Editing Suite",
      desc: "Remove backgrounds, crop, resize, and enhance photos with AI.",
      image: "/image_tools_3d.png",
      badge: "Image Tools",
      features: ["Remove BG Instantly", "Bulk Compress Assets", "AI Photo Enhancer"],
      icon: ImageIcon,
    },
    {
      title: "SEO & Analytics Dashboard",
      desc: "Analyze keyword rankings and track marketing optimization.",
      image: "/seo_tools_3d.png",
      badge: "SEO & Analytics",
      features: ["Keyword Target Auditing", "Google Rankings Tracking", "Backlink Auditor"],
      icon: BarChart3,
    },
    {
      title: "Social Media Planner",
      desc: "Plan content, generate hashtags, and build multi-platform growth.",
      image: "/hero_workspace_clay.png",
      badge: "Social Media",
      features: ["Hashtag Generator", "Scheduler Assistance", "Instagram Caption Writer"],
      icon: Compass,
    },
    {
      title: "AI Copywriter & Editor",
      desc: "Generate blogs, draft emails, and edit copy with magic speed.",
      image: "/hero_workspace_clay.png",
      badge: "AI Writing",
      features: ["Blog Content Generator", "Instant Email Assistant", "Magic Copy Expander"],
      icon: Sparkles,
    },
    {
      title: "Business Operations Suite",
      desc: "Generate invoices, scan QR codes, and automate workflows.",
      image: "/hero_workspace_clay.png",
      badge: "Productivity",
      features: ["QR Code Generator", "Professional Invoices", "File Automation Steps"],
      icon: Cpu,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div className="w-full relative bg-background text-foreground transition-colors duration-300">
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* ================= SECTION 1: HERO (CLEAN TWO-COLUMN SPLIT) ================= */}
      <section className="py-16 md:py-24 px-6 bg-white dark:bg-[#09090B] border-b border-border-color dark:border-white/5 transition-colors duration-300">
        <div 
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          
          {/* Left Column: Hero Text */}
          <div className="space-y-7 text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-white/5 border border-red-100 dark:border-white/10 text-xs font-bold text-[#BE1E2E]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Online Strikers Suite</span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-[#09090B] dark:text-white"
              >
                All Your <span className="text-[#BE1E2E]">Digital Marketing</span> Tools in One Place
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-text-secondary dark:text-slate-400 font-medium leading-relaxed max-w-lg"
              >
                Convert documents, compress images, audit rankings, schedule posts, and write blog articles — all from one dashboard.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-start gap-3.5 pt-2"
            >
              <Link 
                href="/dashboard" 
                className="w-full sm:w-auto btn-primary text-sm font-bold px-8 py-3.5 rounded-xl hover:scale-102 transition-all duration-200 flex items-center justify-center gap-2 shadow-md text-white"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/tools" 
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-[#F3F4F6] dark:bg-white/5 border border-border-color dark:border-white/10 text-[#09090B] dark:text-white rounded-xl hover:bg-[#E5E7EB] dark:hover:bg-white/10 hover:scale-102 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Browse Tools</span>
                <Compass className="w-4 h-4 text-[#BE1E2E]" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Contained Carousel Card */}
          <div className="relative flex flex-col items-center gap-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 90 }}
              className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-[#F3F4F6] dark:bg-[#111115] border border-border-color dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
            >
              {/* Carousel slides */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide}
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Bottom glassmorphism info strip */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#09090B]/75 border-t border-border-color dark:border-white/5 backdrop-blur-md z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-white/5 border border-red-100 dark:border-white/10 flex items-center justify-center text-[#BE1E2E]">
                      {React.createElement(slides[currentSlide].icon, { className: "w-4 h-4" })}
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#09090B] dark:text-white leading-tight">{slides[currentSlide].title}</h3>
                      <p className="text-[10px] text-text-muted dark:text-slate-500 font-semibold mt-0.5">{slides[currentSlide].desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation dots */}
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx 
                      ? "bg-[#BE1E2E] w-6" 
                      : "bg-slate-200 dark:bg-white/15 w-2 hover:bg-[#BE1E2E]/40"
                  }`}
                  title={`Slide ${idx + 1}: ${slides[idx].badge}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 2: CATEGORIES (WHITE/LIGHT CONTRAST BACKGROUND) ================= */}
      <section className="py-20 px-6 bg-white dark:bg-[#111115] border-b border-border-color dark:border-white/5 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#BE1E2E]">Categories</span>
            <h2 className="text-3xl font-extrabold text-[#09090B] dark:text-white">Choose a Tool Category</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {toolCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const isAvailable = cat.count !== "Coming Soon";
              return (
                <Link
                  key={idx}
                  href={cat.slug}
                  className={`p-6 rounded-2xl border text-center flex flex-col items-center gap-4 bg-white dark:bg-card-bg transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${
                    isAvailable
                      ? "border-border-color dark:border-white/5 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:border-[#BE1E2E]/25"
                      : "opacity-60 cursor-not-allowed border-dashed border-border-color dark:border-white/5"
                  }`}
                >
                  {/* 3D Illustration Category Preview */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-red-50 dark:bg-white/5 border border-red-100 dark:border-white/5 flex items-center justify-center relative">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover scale-105" />
                    <div className="absolute inset-0 bg-red-950/5 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#09090B] dark:text-white leading-tight">{cat.name}</h3>
                    <span className="text-[10px] font-bold text-text-muted dark:text-slate-500 mt-1 block">{cat.count}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: QUICK TOOL DEMO SANDBOX (WARM LIGHT GRAY/COOL NEUTRAL) ================= */}
      <section className="py-20 px-6 border-b border-border-color dark:border-white/5 bg-[#F3F4F6] dark:bg-[#09090C] transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#BE1E2E]">Sandbox Demo</span>
            <h2 className="text-3xl font-extrabold text-[#09090B] dark:text-white">Try a Quick Optimization</h2>
            <p className="text-text-secondary dark:text-slate-400 text-sm max-w-md mx-auto font-medium">Click the card below to see our premium lightning-fast file compressor in action.</p>
          </div>

          <GlassCard
            hoverable={false}
            className="border-border-color dark:border-white/5 bg-white dark:bg-card-bg shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-8 rounded-3xl"
          >
            <div className="flex flex-col items-center py-6 min-h-[220px] justify-center">
              {uploadState === "idle" && (
                <div
                  onClick={startUploadSim}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); startUploadSim(); }}
                  className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-300 bg-[#F9FAFB] dark:bg-white/5 text-center ${
                    dragActive
                      ? "border-[#BE1E2E] bg-red-50/50 shadow-[0_0_20px_rgba(190,30,46,0.1)]"
                      : "border-border-color dark:border-white/10 hover:border-[#BE1E2E]/40 hover:bg-red-50/20"
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-white/5 flex items-center justify-center text-[#BE1E2E] animate-bounce">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Click here to compress a mock PDF</p>
                      <p className="text-[10px] text-text-muted dark:text-slate-500 mt-1 font-semibold uppercase tracking-wider">Fast drag & drop sandbox</p>
                    </div>
                  </div>
                </div>
              )}

              {uploadState === "uploading" && (
                <div className="w-full max-w-md space-y-4 text-left">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-text-secondary dark:text-slate-400">Uploading payload...</span>
                    <span className="text-[#BE1E2E] font-black">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary-bg dark:bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#BE1E2E] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted dark:text-slate-500 font-bold uppercase tracking-wider text-center">Optimizing quality structure...</p>
                </div>
              )}

              {uploadState === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Your Optimized File is Ready</h4>
                    <p className="text-xs text-text-secondary dark:text-slate-400 font-semibold mt-1 uppercase tracking-wider">Reduced size by 74% (3.4 MB to 884 KB)</p>
                  </div>
                  <div className="flex justify-center gap-4 pt-2">
                    <button
                      onClick={resetUploadSim}
                      className="px-5 py-2.5 rounded-xl border border-border-color dark:border-white/10 text-xs font-bold text-text-secondary dark:text-slate-400 hover:bg-secondary-bg dark:hover:bg-white/10 transition-colors"
                    >
                      Optimize Another
                    </button>
                    <Link
                      href="/dashboard"
                      className="px-5 py-2.5 text-xs btn-primary font-bold shadow-sm hover:scale-102 duration-200 text-white"
                    >
                      Start Free Trial
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ================= SECTION 4: TESTIMONIALS (WHITE BACKGROUND) ================= */}
      <section className="py-20 px-6 bg-white dark:bg-[#111115] border-b border-border-color dark:border-white/5 transition-colors duration-300">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#BE1E2E]">User Stories</span>
            <h2 className="text-3xl font-extrabold text-[#09090B] dark:text-white">Loved by Everyday Users</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, idx) => (
              <GlassCard
                key={idx}
                hoverable={false}
                className="border-border-color dark:border-white/5 bg-white dark:bg-card-bg p-8 text-left flex flex-col justify-between gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-3xl"
              >
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#BE1E2E] text-[#BE1E2E]" />
                    ))}
                  </div>
                  <p className="text-text-secondary dark:text-slate-350 font-medium leading-relaxed text-sm italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-border-color dark:border-white/5 pt-4">
                  <img src={t.avatar} alt={t.author} className="w-9 h-9 rounded-full object-cover border border-border-color dark:border-white/10" />
                  <div>
                    <h5 className="text-xs font-bold text-[#09090B] dark:text-white">{t.author}</h5>
                    <p className="text-[9px] text-[#BE1E2E] font-black uppercase tracking-wider mt-0.5">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: FAQs (SOFT NEUTRAL LIGHT GRAY) ================= */}
      <section className="py-20 px-6 bg-[#F9FAFC] dark:bg-[#09090C] transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#BE1E2E]">Support</span>
            <h2 className="text-3xl font-extrabold text-[#09090B] dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-border-color dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-card-bg shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full p-6 flex justify-between items-center text-slate-800 dark:text-slate-200 hover:text-[#BE1E2E] dark:hover:text-white font-bold transition-all text-sm md:text-base text-left"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4.5 h-4.5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#BE1E2E]" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 text-text-secondary dark:text-slate-400 text-xs md:text-sm leading-relaxed border-t border-border-color dark:border-white/5 font-medium">
                           {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
