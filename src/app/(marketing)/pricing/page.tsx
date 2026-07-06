"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Check, Info, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [creditLimit, setCreditLimit] = useState(25000);

  const getSliderPrice = (credits: number) => {
    if (credits <= 2000) return 29;
    if (credits <= 5000) return 99;
    if (credits <= 15000) return 149;
    if (credits <= 30000) return 249;
    return 399;
  };

  const getCreditLabel = (credits: number) => {
    return credits.toLocaleString();
  };

  const plans = [
    {
      name: "Starter Plan",
      price: billingCycle === "monthly" ? 29 : 24,
      credits: "1,000",
      description: "Ideal for students, teachers, and casual everyday tasks.",
      features: [
        "1,000 Monthly Operations",
        "Full access to PDF tools",
        "Max 15MB file size limit",
        "Access to basic photo resizer",
        "Standard processing speed",
      ],
      popular: false,
    },
    {
      name: "Pro Premium",
      price: billingCycle === "monthly" ? 99 : 79,
      credits: "5,000",
      description: "Great for content creators, small business owners, and office workers.",
      features: [
        "5,000 Monthly Operations",
        "Scan and extract text from photos",
        "Bulk background remover",
        "Smart image format converters",
        "Priority processing speed",
        "Up to 5 shared accounts",
      ],
      popular: true,
    },
    {
      name: "Custom Team",
      price: "Custom",
      credits: "Unlimited",
      description: "For schools, large offices, and organizations needing custom limits.",
      features: [
        "Custom operation allowances",
        "Super fast processing queue",
        "Advanced document settings",
        "Unlimited shared accounts",
        "Dedicated account manager",
        "24/7 Priority support response",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen py-20 md:py-32 px-6 max-w-7xl mx-auto relative bg-background text-foreground transition-colors duration-300 text-slate-800 dark:text-slate-200">
      
      {/* Background ambient red glow */}
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] bg-[#BE1E2E]/10 dark:bg-[#BE1E2E]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[450px] h-[450px] bg-[#0EA5E9]/8 dark:bg-[#0EA5E9]/3 rounded-full blur-[130px] pointer-events-none" />

      {/* Title */}
      <div className="max-w-3xl mx-auto text-center space-y-6 mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BE1E2E]/10 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-[#BE1E2E] dark:text-rose-400">
          Flexible Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground dark:text-white tracking-tight leading-tight">
          Simple, Affordable Plans
        </h1>
        <p className="text-text-secondary dark:text-slate-400 text-lg font-semibold">
          Choose the perfect plan for your tasks, or slide to custom-build your own limit below.
        </p>

        {/* Toggle billing */}
        <div className="flex items-center justify-center pt-4 select-none">
          <div className="flex warm-chip-bg border border-border-color dark:border-white/10 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-color/30"
                  : "text-text-secondary dark:text-slate-400 hover:text-foreground dark:hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-color/30"
                  : "text-text-secondary dark:text-slate-400 hover:text-foreground dark:hover:text-white"
              }`}
            >
              <span>Yearly Cycle</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-28 text-left relative z-10">
        {plans.map((plan) => (
          <GlassCard
            key={plan.name}
            glowColor="none"
            hoverable={true}
            className={`flex flex-col gap-6 relative p-7 bg-white border-border-color dark:bg-card-bg dark:border-white/5 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${
              plan.popular ? "border-[#BE1E2E]/45 dark:border-[#BE1E2E]/40 shadow-[0_8px_30px_rgba(190,30,46,0.12)] dark:shadow-[0_12px_40px_rgba(190,30,46,0.25)]" : ""
            }`}
          >
            {plan.popular && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] uppercase font-bold tracking-widest px-3.5 py-1 rounded-full bg-[#BE1E2E] text-white shadow-[0_4px_12px_rgba(190,30,46,0.35)] z-20">
                Most Popular
              </span>
            )}

            <div className="space-y-2 text-left">
              <h3 className="text-xl font-bold text-foreground dark:text-white">{plan.name}</h3>
              <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed font-semibold min-h-[32px]">{plan.description}</p>
            </div>

            <div className="text-left border-y border-border-color dark:border-white/5 py-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-foreground dark:text-white">
                  {typeof plan.price === "number" ? `$${plan.price}` : plan.price}
                </span>
                {typeof plan.price === "number" && (
                  <span className="text-xs text-text-muted dark:text-slate-500 font-bold">/month</span>
                )}
              </div>
              <p className="text-[10px] text-[#BE1E2E] font-extrabold uppercase tracking-wider mt-1.5">{plan.credits} Monthly Operations</p>
            </div>

            <ul className="flex-1 space-y-3 text-left">
              {plan.features.map((feat) => (
                <li key={feat} className="flex gap-2.5 text-xs text-text-secondary dark:text-slate-350 font-semibold leading-relaxed items-start">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full ${
                plan.popular
                  ? "btn-primary py-3.5 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98]"
                  : "btn-secondary py-3.5 rounded-xl text-xs"
              }`}
            >
              {plan.price === "Custom" ? "Contact Support" : "Select Plan"}
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Credit Slider Widget */}
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="space-y-4 mb-14">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground dark:text-white tracking-tight">
            Choose Your Monthly Limit
          </h2>
          <p className="text-text-secondary dark:text-slate-400 text-sm max-w-lg mx-auto font-semibold">
            Need more operations for large projects? Adjust the slider below to find the perfect plan for you.
          </p>
        </div>

        <GlassCard
          hoverable={false}
          className="border-border-color dark:border-white/5 bg-white dark:bg-[#121215]/80 p-8 space-y-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-left">
            <div className="space-y-1">
              <p className="text-[10px] text-text-muted dark:text-slate-500 font-extrabold uppercase tracking-wider">Required Operations</p>
              <h4 className="text-3xl font-extrabold text-[#BE1E2E]">{getCreditLabel(creditLimit)} /mo</h4>
            </div>

            <div className="space-y-1 sm:text-right text-center">
              <p className="text-[10px] text-text-muted dark:text-slate-500 font-extrabold uppercase tracking-wider">Estimated Cost</p>
              <h4 className="text-3xl font-extrabold text-foreground dark:text-white">
                ${getSliderPrice(creditLimit)} <span className="text-xs text-text-muted dark:text-slate-500 font-bold">/mo</span>
              </h4>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#BE1E2E] focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-text-muted dark:text-slate-500 font-bold uppercase tracking-wider px-1">
              <span>1k Operations</span>
              <span>15k Operations</span>
              <span>30k Operations</span>
              <span>50k Operations</span>
            </div>
          </div>

          <div className="bg-warm-bg dark:bg-white/2 border border-border-color dark:border-white/5 rounded-2xl p-4 flex gap-3 text-xs text-text-secondary dark:text-slate-400 leading-relaxed text-left items-start font-semibold shadow-inner">
            <HelpCircle className="w-5 h-5 text-[#BE1E2E] shrink-0 mt-0.5" />
            <p>
              Operations limit resets at the end of each monthly billing cycle. Additional resource packages can be purchased as add-ons at any time inside your dashboard settings.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
