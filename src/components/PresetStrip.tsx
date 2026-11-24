"use client";

import React from "react";
import { EVALUATOR_PRESETS, EvaluatorPreset } from "@/lib/presets";
import { Compass } from "lucide-react";

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
      className="border-b border-[#DCE3EC] bg-[#FFFFFF] py-2 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[#525E70] shrink-0 font-medium">
          <Compass className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" aria-hidden="true" />
          <span>Scenarios:</span>
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
                title={preset.description}
                aria-label={`${preset.title}: ${preset.description}`}
                aria-pressed={isActive}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors text-left whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#0F172A] text-[#FFFFFF] border-[#0F172A] font-semibold"
                    : "bg-[#F1F4F8] text-[#334155] border-[#DCE3EC] hover:border-[#1D4ED8] hover:text-[#0F172A]"
                }`}
              >
                <span>{preset.title}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? "bg-[#1E293B] text-[#E2E8F0]"
                      : "bg-[#FFFFFF] text-[#525E70] border border-[#DCE3EC]"
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
