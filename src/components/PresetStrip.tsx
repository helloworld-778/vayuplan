"use client";

import React from "react";
import { EVALUATOR_PRESETS, EvaluatorPreset } from "@/lib/presets";
import { Sparkles } from "lucide-react";

interface PresetStripProps {
  activePresetId: string | null;
  onSelectPreset: (preset: EvaluatorPreset) => void;
  isLoading: boolean;
}

export function PresetStrip({
  activePresetId,
  onSelectPreset,
  isLoading,
}: PresetStripProps) {
  const presets = Object.values(EVALUATOR_PRESETS);

  return (
    <nav
      aria-label="Evaluator quick-test presets"
      className="border-b border-[#E2DFD6] bg-[#FAF8F5] py-2 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[#5E6470] shrink-0 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Evaluator Presets:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded border transition-all text-left whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#14181F] text-[#FFFFFF] border-[#14181F] shadow-xs font-semibold"
                    : "bg-[#FFFFFF] text-[#2B303B] border-[#DDD9CE] hover:border-[#14181F] hover:bg-[#F2EFE9]"
                }`}
              >
                <span>{preset.title}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isActive
                      ? "bg-[#2B303B] text-[#DCD8CF]"
                      : "bg-[#EFECE6] text-[#6E7582]"
                  }`}
                >
                  {preset.location.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
