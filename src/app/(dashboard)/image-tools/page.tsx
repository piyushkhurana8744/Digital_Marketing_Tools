import React from "react";
import Link from "next/link";
import { getToolsByCategory } from "@/lib/tools/registry";
import { GlassCard } from "@/components/ui/glass-card";
import { Image as ImageIcon, ArrowRight, Info } from "lucide-react";
import * as LucideIcons from "lucide-react";

export const metadata = {
  title: "Image Optimizers Suite - DigiTools AI",
  description: "Compress, resize, crop, and convert image files online instantly. Powered by AI background extraction tools.",
};

export default async function ImageToolsCategoryPage() {
  const imageTools = getToolsByCategory("image");

  return (
    <div className="space-y-8 pb-10 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Image Optimizers</h1>
        <p className="text-slate-400 text-sm mt-1">
          Resize, crop, convert, and remove backgrounds with AI-driven pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {imageTools.map((tool) => {
          // Resolve Lucide icon
          const IconComponent = (LucideIcons as any)[tool.iconName] || ImageIcon;

          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <GlassCard
                glowColor={tool.color}
                className="h-full flex flex-col justify-between items-start gap-4 p-6 hover:border-white/15"
              >
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <IconComponent className={`w-5 h-5 text-neon-${tool.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                      {tool.category}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-neon-violet transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed truncate-3-lines">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between border-t border-white/5 pt-4 text-[10px] font-semibold">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Cost: {tool.creditsCost} credits</span>
                  </span>
                  <span className="text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
