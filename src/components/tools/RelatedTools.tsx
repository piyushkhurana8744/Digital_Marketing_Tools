import React from "react";
import Link from "next/link";
import { getToolsByCategory } from "@/lib/tools/registry";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface RelatedToolsProps {
  currentSlug: string;
  category: "pdf" | "image";
}

export function RelatedTools({ currentSlug, category }: RelatedToolsProps) {
  // Query similar category tools, filter out current, limit to 3 suggestions
  const related = getToolsByCategory(category)
    .filter((t) => t.slug !== currentSlug)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="space-y-4 pt-10 border-t border-white/5 text-left text-slate-200">
      <div>
        <h3 className="text-xl font-bold text-white">Related Utilities</h3>
        <p className="text-slate-400 text-xs mt-0.5">Explore additional dynamic tools in the same category.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((tool) => {
          // Dynamic Lucide icon resolver
          const IconComponent = (LucideIcons as any)[tool.iconName] || LucideIcons.FileText;

          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <GlassCard
                glowColor="none"
                className="h-full flex flex-col justify-between items-start gap-4 p-5 border-white/5 bg-white/3 hover:border-[#BE1E2E]/25 transition-all text-left shadow-2xl"
              >
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <IconComponent className="w-4.5 h-4.5 text-[#BE1E2E]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm group-hover:text-[#BE1E2E] transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-[#BE1E2E] flex items-center gap-1 group-hover:translate-x-1.5 transition-transform border-t border-white/5 w-full pt-3 mt-1 font-bold text-glow-red">
                  <span>Use Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
