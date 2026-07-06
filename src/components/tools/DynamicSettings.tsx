"use client";

import React from "react";

interface ToolSettingField {
  name: string;
  label: string;
  type: "select" | "slider" | "toggle" | "text" | "number";
  defaultValue: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface DynamicSettingsProps {
  fields: ToolSettingField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  accentColor: "cyan" | "pink" | "emerald" | "violet";
}

export function DynamicSettings({ fields, values, onChange, accentColor }: DynamicSettingsProps) {
  if (fields.length === 0) {
    return null;
  }

  // Map to unified Strikers colors
  const strikersAccentClass = "accent-[#BE1E2E]";
  const strikersFocusClass = "focus:border-[#BE1E2E] focus:ring-1 focus:ring-[#BE1E2E]";
  const strikersToggleClass = "bg-red-50 dark:bg-red-950/25 border-[#BE1E2E]/20 text-[#BE1E2E] dark:text-red-400";

  return (
    <div className="space-y-5 border-t border-black/5 dark:border-white/5 pt-5">
      <h4 className="text-xs text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider text-left select-none">
        Tool Configurations
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {fields.map((field) => {
          const val = values[field.name] !== undefined ? values[field.name] : field.defaultValue;

          return (
            <div key={field.name} className="space-y-1.5 flex flex-col justify-end">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                {field.label}
              </label>

              {/* SELECT FIELD */}
              {field.type === "select" && (
                <select
                  value={val}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className={`w-full bg-white/50 dark:bg-black/10 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none ${strikersFocusClass} transition-colors`}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-[#0c0c14] text-slate-800 dark:text-slate-200">
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {/* SLIDER FIELD */}
              {field.type === "slider" && (
                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 select-none">
                    <span>{field.min}</span>
                    <span className="font-mono text-xs text-foreground bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{val}%</span>
                    <span>{field.max}</span>
                  </div>
                  <input
                    type="range"
                    min={field.min ?? 0}
                    max={field.max ?? 100}
                    step={field.step ?? 1}
                    value={val}
                    onChange={(e) => onChange(field.name, parseInt(e.target.value))}
                    className={`w-full h-1 bg-slate-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer ${strikersAccentClass}`}
                  />
                </div>
              )}

              {/* TOGGLE FIELD */}
              {field.type === "toggle" && (
                <button
                  type="button"
                  onClick={() => onChange(field.name, !val)}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    val
                      ? strikersToggleClass
                      : "bg-slate-50/50 dark:bg-black/5 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-350 hover:text-foreground"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${val ? "bg-current animate-pulse" : "bg-slate-400 dark:bg-slate-600"}`} />
                  <span>{val ? "Enabled" : "Disabled"}</span>
                </button>
              )}

              {/* TEXT FIELD */}
              {field.type === "text" && (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className={`w-full bg-white/50 dark:bg-black/10 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none ${strikersFocusClass} placeholder-slate-400 dark:placeholder-slate-655 transition-colors`}
                  placeholder="e.g. all or 1-5"
                />
              )}

              {/* NUMBER FIELD */}
              {field.type === "number" && (
                <input
                  type="number"
                  value={val}
                  onChange={(e) => onChange(field.name, parseInt(e.target.value) || 0)}
                  className={`w-full bg-white/50 dark:bg-black/10 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none ${strikersFocusClass} transition-colors`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
