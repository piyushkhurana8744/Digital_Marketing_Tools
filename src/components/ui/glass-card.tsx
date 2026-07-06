"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glowColor?: "violet" | "cyan" | "pink" | "emerald" | "none";
  hoverable?: boolean;
}

export function GlassCard({
  children,
  className,
  glowColor = "none",
  hoverable = true,
  ...props
}: GlassCardProps) {
  const glowClasses = {
    none: "",
    violet: "glow-violet-hover",
    cyan: "glow-cyan-hover",
    pink: "glow-pink-hover",
    emerald: "glow-emerald-hover",
  };

  return (
    <motion.div
      whileHover={hoverable ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={twMerge(
        "glass-panel rounded-2xl p-6 transition-all duration-300",
        hoverable && "cursor-pointer",
        glowColor !== "none" && glowClasses[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
