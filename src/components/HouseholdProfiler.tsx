"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronDown,
  Shield,
  Flame,
  Wind,
} from "lucide-react";

interface HouseholdProfilerProps {
  profile: HouseholdProfile;
  onChangeProfile: (updated: HouseholdProfile) => void;
  onApplyPlan: (nextProfile?: HouseholdProfile) => void;
  isPlanLoading: boolean;
}

const PERSONAS: { value: PersonaType; label: string; desc: string }[] = [
  {
    value: "commuter",
    label: "Commuter",
    desc: "Daily office or campus travel",
  },
  {
    value: "family_with_kids",
    label: "Family with Kids",
    desc: "Children & school schedules",
  },
  {
    value: "senior_citizen",
    label: "Senior Citizen",
    desc: "Cardiopulmonary protection focus",
  },
  {
    value: "student_athlete",
    label: "Student / Athlete",
    desc: "High-ventilation outdoor sessions",
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
  { value: "open", label: "Open (85% infiltration)" },
  { value: "cracked", label: "Cracked (60% infiltration)" },
  { value: "sealed", label: "Sealed (35% infiltration)" },
];

function getLabel<T extends string>(
  items: Array<{ value: T; label: string }>,
  val: T
): string {
  return items.find((i) => i.value === val)?.label ?? val;
}

export function HouseholdProfiler({
  profile,
  onChangeProfile,
  onApplyPlan,
  isPlanLoading,
}: HouseholdProfilerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [draft, setDraft] = useState<HouseholdProfile>(profile);

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
    setIsExpanded(false);
    onApplyPlan(draft);
  };

  const handleReset = () => {
    setDraft(profile);
    setHasChanges(false);
  };

  const personaLabel = getLabel(PERSONAS, draft.persona);
  const commuteLabel = getLabel(COMMUTE_MODES, draft.currentCommuteMode);
  const maskLabel = getLabel(MASKS, draft.maskType);

  return (
    <section
      aria-label="Household context and exposure controls"
      className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden"
    >
      {/* Compact Household Context Bar */}
      <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF]">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mr-1">
            <SlidersHorizontal
              className="w-3.5 h-3.5 text-[#334155]"
              aria-hidden="true"
            />
            <span>Context</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded bg-[#F1F4F8] px-2.5 py-1 text-xs font-medium text-[#0F172A]">
            {personaLabel}
            {draft.hasRespiratorySensitivity && (
              <HeartPulse
                role="img"
                aria-label="Respiratory sensitivity enabled"
                className="w-3.5 h-3.5 text-[#DC2626]"
              />
            )}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded bg-[#F1F4F8] px-2.5 py-1 text-xs text-[#334155]">
            <Car className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
            <span>{commuteLabel}</span>
            <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
              {draft.commuteDistanceKm} km
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded bg-[#F1F4F8] px-2.5 py-1 text-xs text-[#334155]">
            <Shield className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
            <span>Mask: {maskLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded bg-[#F1F4F8] px-2.5 py-1 text-xs text-[#334155] capitalize">
            <Home className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
            <span>{draft.windowsState} windows</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded bg-[#F1F4F8] px-2.5 py-1 text-xs text-[#334155]">
            <Wind className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
            <span>{draft.hasAirPurifier ? "HEPA On" : "No Purifier"}</span>
          </span>

          {draft.usesIncenseOrSolidFuel && (
            <span className="inline-flex items-center gap-1.5 rounded border bg-[#FFFBEB] border-[#FCD34D] text-[#92400E] font-medium px-2.5 py-1 text-xs">
              <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Incense Active</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#334155] hover:text-[#0F172A] px-3 min-h-[40px] rounded-lg border border-[#64748B]/70 bg-[#FFFFFF] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={isPlanLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 min-h-[40px] rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-[#FFFFFF] transition-colors disabled:opacity-55"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Apply Changes</span>
              </button>
            </>
          )}

          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls="household-context-drawer"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 min-h-[40px] rounded-lg border border-[#64748B]/70 bg-[#FFFFFF] text-[#0F172A] hover:border-[#1D4ED8] transition-colors"
          >
            <span>{isExpanded ? "Close" : "Edit Context"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#525E70] transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Collapsible Controls Drawer */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="household-context-drawer"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[#DCE3EC] bg-[#F7F8FA]"
          >
            <div className="p-5 sm:p-6 space-y-6">
              {/* Persona Selection */}
              <div>
                <h2 className="text-xs font-semibold text-[#0F172A] mb-2.5">
                  Persona &amp; Activity Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {PERSONAS.map((p) => {
                    const isSelected = draft.persona === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => updateDraft("persona", p.value)}
                        className={`p-3 min-h-[44px] rounded-lg border text-left transition-colors ${
                          isSelected
                            ? "bg-[#EFF6FF] border-[#1D4ED8] text-[#0F172A]"
                            : "bg-[#FFFFFF] border-[#DCE3EC] hover:border-[#64748B] text-[#334155]"
                        }`}
                      >
                        <div className="text-sm font-semibold text-[#0F172A]">
                          {p.label}
                        </div>
                        <div className="text-xs text-[#525E70] mt-0.5">
                          {p.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Health Sensitivity Switch */}
              <div className="flex items-center justify-between gap-4 pt-5 border-t border-[#DCE3EC]">
                <div className="flex items-center gap-3">
                  <HeartPulse
                    className="w-5 h-5 text-[#DC2626] shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#0F172A] block">
                      Cardiopulmonary &amp; Respiratory Sensitivity
                    </span>
                    <span className="text-xs text-[#525E70]">
                      Tightens outdoor safe thresholds for asthma, COPD, children, or older adults.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.hasRespiratorySensitivity}
                  aria-label="Cardiopulmonary and respiratory sensitivity"
                  onClick={() =>
                    updateDraft(
                      "hasRespiratorySensitivity",
                      !draft.hasRespiratorySensitivity
                    )
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    draft.hasRespiratorySensitivity
                      ? "bg-[#1D4ED8]"
                      : "bg-[#64748B]"
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
              <div className="border-t border-[#DCE3EC] pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-[#334155]" aria-hidden="true" />
                  <h3 className="text-xs font-semibold text-[#0F172A]">
                    Commute &amp; Transit Routine
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#DCE3EC]">
                    <div className="flex justify-between items-center mb-2">
                      <label
                        htmlFor="commute-distance-slider"
                        className="text-xs font-medium text-[#334155]"
                      >
                        One-Way Commute
                      </label>
                      <span className="font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                        {draft.commuteDistanceKm} km
                      </span>
                    </div>
                    <input
                      id="commute-distance-slider"
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={draft.commuteDistanceKm}
                      disabled={draft.currentCommuteMode === "work_from_home"}
                      onChange={(e) =>
                        updateDraft(
                          "commuteDistanceKm",
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full accent-[#1D4ED8] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-xs text-[#525E70] mt-1.5 font-mono tabular-nums">
                      <span>0 km</span>
                      <span>30 km</span>
                      <span>60 km</span>
                    </div>
                    {draft.currentCommuteMode === "work_from_home" && (
                      <p className="text-xs text-[#525E70] mt-1.5">
                        Locked to 0 km for Remote / WFH schedule.
                      </p>
                    )}
                  </div>

                  <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#DCE3EC]">
                    <label
                      htmlFor="commute-mode-select"
                      className="text-xs font-medium text-[#334155] block mb-1.5"
                    >
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
                            commuteDistanceKm:
                              prev.commuteDistanceKm === 0
                                ? 10
                                : prev.commuteDistanceKm,
                          }));
                          setHasChanges(true);
                        }
                      }}
                      className="w-full py-2 px-2.5 min-h-[44px] bg-[#F1F4F8] border border-[#64748B]/70 rounded-md text-base sm:text-xs text-[#0F172A] font-medium focus:border-[#1D4ED8]"
                    >
                      {COMMUTE_MODES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#DCE3EC]">
                    <label
                      htmlFor="mask-type-select"
                      className="text-xs font-medium text-[#334155] block mb-1.5"
                    >
                      Transit Mask Type
                    </label>
                    <select
                      id="mask-type-select"
                      value={draft.maskType}
                      onChange={(e) =>
                        updateDraft("maskType", e.target.value as MaskType)
                      }
                      className="w-full py-2 px-2.5 min-h-[44px] bg-[#F1F4F8] border border-[#64748B]/70 rounded-md text-base sm:text-xs text-[#0F172A] font-medium focus:border-[#1D4ED8]"
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
              <div className="border-t border-[#DCE3EC] pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 text-[#334155]" aria-hidden="true" />
                  <h3 className="text-xs font-semibold text-[#0F172A]">
                    Indoor Building Envelope &amp; Air Habits
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#DCE3EC]">
                    <label
                      htmlFor="window-state-select"
                      className="text-xs font-medium text-[#334155] block mb-1.5"
                    >
                      Window / Balcony Sealing
                    </label>
                    <select
                      id="window-state-select"
                      value={draft.windowsState}
                      onChange={(e) =>
                        updateDraft(
                          "windowsState",
                          e.target.value as WindowsState
                        )
                      }
                      className="w-full py-2 px-2.5 min-h-[44px] bg-[#F1F4F8] border border-[#64748B]/70 rounded-md text-base sm:text-xs text-[#0F172A] font-medium focus:border-[#1D4ED8]"
                    >
                      {WINDOWS.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="bg-[#FFFFFF] p-3.5 min-h-[44px] rounded-lg border border-[#DCE3EC] flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-[#0F172A] block">
                        HEPA Air Purifier
                      </span>
                      <span className="text-xs text-[#525E70]">
                        Active indoor particle filtration
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.hasAirPurifier}
                      onChange={(e) =>
                        updateDraft("hasAirPurifier", e.target.checked)
                      }
                      className="w-5 h-5 accent-[#1D4ED8] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="bg-[#FFFFFF] p-3.5 min-h-[44px] rounded-lg border border-[#DCE3EC] flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-[#0F172A] block">
                        Incense / Agarbatti / Coil
                      </span>
                      <span className="text-xs text-[#525E70]">
                        +45 µg/m³ internal combustion load
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.usesIncenseOrSolidFuel}
                      onChange={(e) =>
                        updateDraft("usesIncenseOrSolidFuel", e.target.checked)
                      }
                      className="w-5 h-5 accent-[#1D4ED8] rounded cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>

              {/* Drawer Bottom Apply / Reset Controls */}
              <div className="pt-4 border-t border-[#DCE3EC] flex flex-wrap items-center justify-end gap-2">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#334155] hover:text-[#0F172A] px-3.5 min-h-[44px] rounded-lg border border-[#64748B]/70 bg-[#FFFFFF] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isPlanLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 min-h-[44px] rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-[#FFFFFF] transition-colors disabled:opacity-55"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Apply Changes</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
