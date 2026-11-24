"use client";

import React, { useState, useEffect } from "react";
import {
  CommuteMode,
  HouseholdProfile,
  MaskType,
  PersonaType,
  WindowsState,
} from "@/types/air-quality";
import {
  SlidersHorizontal,
  HeartPulse,
  Car,
  Home,
  Check,
  RotateCcw,
} from "lucide-react";

interface HouseholdProfilerProps {
  profile: HouseholdProfile;
  onChangeProfile: (updated: HouseholdProfile) => void;
  onApplyPlan: () => void;
  isPlanLoading: boolean;
}

const PERSONAS: { value: PersonaType; label: string; desc: string }[] = [
  {
    value: "commuter",
    label: "Commuter",
    desc: "Daily office / university travel",
  },
  {
    value: "family_with_kids",
    label: "Family with Kids",
    desc: "Young lungs & school routines",
  },
  {
    value: "senior_citizen",
    label: "Senior Citizen",
    desc: "Vulnerable cardiopulmonary health",
  },
  {
    value: "student_athlete",
    label: "Student / Athlete",
    desc: "High ventilation cardiovascular cardio",
  },
];

const COMMUTE_MODES: { value: CommuteMode; label: string }[] = [
  { value: "petrol_car", label: "Solo Car" },
  { value: "two_wheeler", label: "Two-Wheeler" },
  { value: "metro_transit", label: "Metro / Train" },
  { value: "carpool", label: "Carpool / Cab" },
  { value: "bicycle_walk", label: "Bicycle / Walk" },
  { value: "work_from_home", label: "Remote / WFH" },
];

const MASKS: { value: MaskType; label: string; filtration: string }[] = [
  { value: "none", label: "None", filtration: "0%" },
  { value: "cloth", label: "Cloth", filtration: "~25%" },
  { value: "surgical", label: "Surgical", filtration: "~55%" },
  { value: "n95", label: "N95 / FFP2", filtration: "≥95%" },
];

const WINDOWS: { value: WindowsState; label: string }[] = [
  { value: "open", label: "Open (85% Infiltration)" },
  { value: "cracked", label: "Cracked (60% Infiltration)" },
  { value: "sealed", label: "Sealed (35% Infiltration)" },
];

export function HouseholdProfiler({
  profile,
  onChangeProfile,
  onApplyPlan,
  isPlanLoading,
}: HouseholdProfilerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Local draft state to avoid firing API calls on every tick
  const [draft, setDraft] = useState<HouseholdProfile>(profile);

  // Sync draft when external profile changes (e.g. preset clicked)
  useEffect(() => {
    setDraft(profile);
    setHasChanges(false);
  }, [profile]);

  const updateDraft = <K extends keyof HouseholdProfile>(
    field: K,
    value: HouseholdProfile[K]
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      setHasChanges(true);
      return next;
    });
  };

  const handleApply = () => {
    onChangeProfile(draft);
    setHasChanges(false);
    onApplyPlan();
  };

  const handleReset = () => {
    setDraft(profile);
    setHasChanges(false);
  };

  return (
    <section
      aria-label="Household and lifestyle configuration"
      className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg shadow-xs overflow-hidden"
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#EAE7DF] bg-[#FAF9F6]">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-[#14181F]" />
          <div>
            <h2 className="text-sm font-bold text-[#14181F]">
              Household & Lifestyle Profiler
            </h2>
            <p className="text-xs text-[#5E6470]">
              Personalized exposure physics: {draft.persona.replace("_", " ")} • {draft.currentCommuteMode.replace("_", " ")} ({draft.commuteDistanceKm} km)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#6E7582] hover:text-[#14181F] flex items-center gap-1 px-2 py-1 rounded"
              title="Discard unsaved changes"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={isPlanLoading}
            className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              hasChanges
                ? "bg-[#14181F] text-[#FFFFFF] hover:bg-[#2B303B] shadow-xs animate-pulse"
                : "bg-[#EFECE6] text-[#474D58] hover:bg-[#E5E2D9]"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Update Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-[#5E6470] hover:text-[#14181F] px-2 py-1 underline decoration-dotted"
          >
            {isExpanded ? "Collapse" : "Edit Settings"}
          </button>
        </div>
      </div>

      {/* Expandable Controls Panel */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 text-xs">
          {/* Persona Selection */}
          <div>
            <label className="font-bold text-[#14181F] block mb-2">
              Persona & Activity Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PERSONAS.map((p) => {
                const isSelected = draft.persona === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateDraft("persona", p.value)}
                    className={`p-3 rounded border text-left transition-all ${
                      isSelected
                        ? "bg-[#F7F6F2] border-[#14181F] ring-1 ring-[#14181F]"
                        : "bg-[#FFFFFF] border-[#DDD9CE] hover:border-[#8C93A0]"
                    }`}
                  >
                    <div className="font-bold text-[#14181F]">{p.label}</div>
                    <div className="text-[11px] text-[#5E6470] mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Health Sensitivity Switch */}
          <div className="flex items-center justify-between p-3.5 rounded border border-[#E2DFD6] bg-[#FAF8F5]">
            <div className="flex items-center gap-3">
              <HeartPulse className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold text-[#14181F] block">
                  Cardiopulmonary & Respiratory Sensitivity
                </span>
                <span className="text-[11px] text-[#5E6470]">
                  Flags asthma, COPD, bronchitis, cardiovascular conditions, elderly, or toddlers (tightens outdoor thresholds).
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={draft.hasRespiratorySensitivity}
              onClick={() =>
                updateDraft(
                  "hasRespiratorySensitivity",
                  !draft.hasRespiratorySensitivity
                )
              }
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                draft.hasRespiratorySensitivity
                  ? "bg-rose-600"
                  : "bg-[#DCD8CF]"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-[#FFFFFF] absolute top-1 transition-transform ${
                  draft.hasRespiratorySensitivity ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Commute Parameters */}
          <div className="border-t border-[#EAE7DF] pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-[#14181F]" />
              <label className="font-bold text-[#14181F]">
                Commute & Transit Routine
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Distance Slider */}
              <div className="bg-[#FAF9F6] p-3.5 rounded border border-[#DDD9CE]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-[#2B303B]">
                    One-Way Commute
                  </span>
                  <span className="font-mono font-bold text-sm text-[#14181F]">
                    {draft.commuteDistanceKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={draft.commuteDistanceKm}
                  disabled={draft.currentCommuteMode === "work_from_home"}
                  onChange={(e) =>
                    updateDraft("commuteDistanceKm", parseInt(e.target.value, 10))
                  }
                  className="w-full accent-[#14181F] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="One-way commute distance in kilometers"
                />
                <div className="flex justify-between text-[10px] text-[#7A8290] mt-1 font-mono">
                  <span>0 km (WFH)</span>
                  <span>30 km</span>
                  <span>60 km</span>
                </div>
                {draft.currentCommuteMode === "work_from_home" && (
                  <p className="text-[10px] text-[#5E6470] mt-1">
                    Commute disabled for remote / work-from-home routine (0 km).
                  </p>
                )}
              </div>

              {/* Commute Mode */}
              <div className="bg-[#FAF9F6] p-3.5 rounded border border-[#DDD9CE]">
                <label htmlFor="commute-mode-select" className="text-xs font-medium text-[#2B303B] block mb-1.5">
                  Primary Commute Mode
                </label>
                <select
                  id="commute-mode-select"
                  value={draft.currentCommuteMode}
                  onChange={(e) => {
                    const mode = e.target.value as CommuteMode;
                    if (mode === "work_from_home") {
                      setDraft((prev) => ({
                        ...prev,
                        currentCommuteMode: mode,
                        commuteDistanceKm: 0,
                      }));
                      setHasChanges(true);
                    } else {
                      setDraft((prev) => ({
                        ...prev,
                        currentCommuteMode: mode,
                        commuteDistanceKm: prev.commuteDistanceKm === 0 ? 10 : prev.commuteDistanceKm,
                      }));
                      setHasChanges(true);
                    }
                  }}
                  className="w-full py-1.5 px-2 bg-[#FFFFFF] border border-[#DDD9CE] rounded text-xs text-[#14181F] font-medium focus:outline-none focus:border-[#14181F]"
                >
                  {COMMUTE_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mask Type */}
              <div className="bg-[#FAF9F6] p-3.5 rounded border border-[#DDD9CE]">
                <label className="text-xs font-medium text-[#2B303B] block mb-1.5">
                  Transit Mask Type
                </label>
                <select
                  value={draft.maskType}
                  onChange={(e) =>
                    updateDraft("maskType", e.target.value as MaskType)
                  }
                  className="w-full py-1.5 px-2 bg-[#FFFFFF] border border-[#DDD9CE] rounded text-xs text-[#14181F] font-medium focus:outline-none focus:border-[#14181F]"
                >
                  {MASKS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label} ({m.filtration} efficiency)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Indoor Environment */}
          <div className="border-t border-[#EAE7DF] pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-[#14181F]" />
              <label className="font-bold text-[#14181F]">
                Indoor Building Envelope & Air Habits
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Window State */}
              <div className="bg-[#FAF9F6] p-3.5 rounded border border-[#DDD9CE]">
                <label className="text-xs font-medium text-[#2B303B] block mb-1.5">
                  Window / Balcony Sealing
                </label>
                <select
                  value={draft.windowsState}
                  onChange={(e) =>
                    updateDraft("windowsState", e.target.value as WindowsState)
                  }
                  className="w-full py-1.5 px-2 bg-[#FFFFFF] border border-[#DDD9CE] rounded text-xs text-[#14181F] font-medium focus:outline-none focus:border-[#14181F]"
                >
                  {WINDOWS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Air Purifier Toggle */}
              <div className="bg-[#FAF9F6] p-3.5 rounded border border-[#DDD9CE] flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[#2B303B] block">
                    HEPA Air Purifier
                  </span>
                  <span className="text-[10px] text-[#6E7582]">
                    Active room filtration
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={draft.hasAirPurifier}
                  onChange={(e) => updateDraft("hasAirPurifier", e.target.checked)}
                  className="w-4 h-4 accent-[#14181F] rounded cursor-pointer"
                />
              </div>

              {/* Incense / Solid Fuel Toggle */}
              <div className="bg-[#FAF9F6] p-3.5 rounded border border-[#DDD9CE] flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[#2B303B] block">
                    Incense / Agarbatti / Coil
                  </span>
                  <span className="text-[10px] text-[#6E7582]">
                    +45 µg/m³ internal emission
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={draft.usesIncenseOrSolidFuel}
                  onChange={(e) =>
                    updateDraft("usesIncenseOrSolidFuel", e.target.checked)
                  }
                  className="w-4 h-4 accent-[#14181F] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
