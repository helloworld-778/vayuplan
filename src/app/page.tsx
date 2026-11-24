"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
  ResolvedLocation,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { EVALUATOR_PRESETS, EvaluatorPreset } from "@/lib/presets";
import { TopBar } from "@/components/TopBar";
import { PresetStrip } from "@/components/PresetStrip";
import { TelemetryHero } from "@/components/TelemetryHero";
import { HouseholdProfiler } from "@/components/HouseholdProfiler";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { AlertCircle, RefreshCw } from "lucide-react";

const STORAGE_KEY_LOCATION = "vayuplan_location";
const STORAGE_KEY_PROFILE = "vayuplan_profile";

export default function Home() {
  // Default to Delhi Commuter preset
  const defaultPreset = EVALUATOR_PRESETS["delhi-commuter"];

  const [location, setLocation] = useState<ResolvedLocation>(defaultPreset.location);
  const [profile, setProfile] = useState<HouseholdProfile>(defaultPreset.profile);
  const [activePresetId, setActivePresetId] = useState<string | null>("delhi-commuter");

  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [plan, setPlan] = useState<AssistantPlanResponse | null>(null);
  const [analytics, setAnalytics] = useState<ComputedAnalytics | null>(null);

  const [isTelemetryLoading, setIsTelemetryLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const activeTelemetryAbortRef = useRef<AbortController | null>(null);
  const activePlanAbortRef = useRef<AbortController | null>(null);

  // Cleanup in-flight requests on unmount
  useEffect(() => {
    return () => {
      activeTelemetryAbortRef.current?.abort();
      activePlanAbortRef.current?.abort();
    };
  }, []);

  // Fetch telemetry for location with race condition protection
  const loadTelemetry = useCallback(
    async (loc: ResolvedLocation) => {
      if (activeTelemetryAbortRef.current) {
        activeTelemetryAbortRef.current.abort();
      }
      const controller = new AbortController();
      activeTelemetryAbortRef.current = controller;

      setIsTelemetryLoading(true);
      setErrorMessage(null);
      setLiveAnnouncement(`Fetching live air quality telemetry for ${loc.name}...`);

      try {
        const res = await fetch(
          `/api/air-quality?lat=${loc.lat}&lon=${loc.lon}&name=${encodeURIComponent(
            loc.name
          )}&state=${encodeURIComponent(loc.state)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to retrieve telemetry.");
        }

        const data: AirQualitySnapshot = await res.json();
        setSnapshot(data);
        setLiveAnnouncement(
          `Live air quality loaded for ${loc.name}. NAQI is ${data.naqi}, category ${data.category}.`
        );
        return data;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return null;
        }
        const msg = (err as Error).message || "Atmospheric telemetry service unreachable.";
        setErrorMessage(msg);
        setLiveAnnouncement(`Error: ${msg}`);
        return null;
      } finally {
        if (activeTelemetryAbortRef.current === controller) {
          setIsTelemetryLoading(false);
        }
      }
    },
    []
  );

  // Generate / update plan from snapshot + profile with race condition protection
  const loadPlan = useCallback(
    async (curSnapshot: AirQualitySnapshot, curProfile: HouseholdProfile) => {
      if (activePlanAbortRef.current) {
        activePlanAbortRef.current.abort();
      }
      const controller = new AbortController();
      activePlanAbortRef.current = controller;

      setIsPlanLoading(true);
      setLiveAnnouncement("Updating personalized plan and environmental calculations...");

      try {
        const res = await fetch("/api/assistant/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot: curSnapshot,
            profile: curProfile,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Plan generation encountered an issue.");
        }

        const data = await res.json();
        setPlan(data.plan);
        setAnalytics(data.analytics);
        setLiveAnnouncement("Personalized air quality plan updated successfully.");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.warn("Plan generation fallback note:", err);
      } finally {
        if (activePlanAbortRef.current === controller) {
          setIsPlanLoading(false);
        }
      }
    },
    []
  );

  // Hydrate from localStorage on initial mount safely without SSR hydration mismatch
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem(STORAGE_KEY_LOCATION);
      const savedProf = localStorage.getItem(STORAGE_KEY_PROFILE);

      let initialLoc = defaultPreset.location;
      let initialProf = defaultPreset.profile;

      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed.lat && parsed.lon && parsed.name) {
          initialLoc = parsed;
          setLocation(parsed);
          setActivePresetId(null);
        }
      }

      if (savedProf) {
        const parsed = JSON.parse(savedProf);
        if (parsed.persona && parsed.currentCommuteMode) {
          initialProf = parsed;
          setProfile(parsed);
        }
      }

      // Initial fetch
      loadTelemetry(initialLoc).then((snap) => {
        if (snap) {
          loadPlan(snap, initialProf);
        }
      });
    } catch {
      // Fallback to default
      loadTelemetry(defaultPreset.location).then((snap) => {
        if (snap) {
          loadPlan(snap, defaultPreset.profile);
        }
      });
    }
  }, [loadTelemetry, loadPlan, defaultPreset.location, defaultPreset.profile]);

  // Handle location selection
  const handleSelectLocation = async (newLoc: ResolvedLocation) => {
    setLocation(newLoc);
    setActivePresetId(null);
    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(newLoc));
    } catch {
      // Ignore quota error
    }

    const snap = await loadTelemetry(newLoc);
    if (snap) {
      loadPlan(snap, profile);
    }
  };

  // Handle preset selection
  const handleSelectPreset = async (preset: EvaluatorPreset) => {
    setLocation(preset.location);
    setProfile(preset.profile);
    setActivePresetId(preset.id);

    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(preset.location));
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(preset.profile));
    } catch {
      // Ignore
    }

    const snap = await loadTelemetry(preset.location);
    if (snap) {
      loadPlan(snap, preset.profile);
    }
  };

  // Handle profile modification
  const handleChangeProfile = (updatedProfile: HouseholdProfile) => {
    setProfile(updatedProfile);
    setActivePresetId(null);
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));
    } catch {
      // Ignore
    }
  };

  // Handle applying updated profile
  const handleApplyPlan = () => {
    if (snapshot) {
      loadPlan(snapshot, profile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2]">
      {/* Skip to Content for Accessibility */}
      <a href="#main-content" className="skip-to-content sr-only focus:not-sr-only">
        Skip to main content
      </a>

      {/* Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Top Bar with Search & GPS */}
      <TopBar
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        isLoading={isTelemetryLoading || isPlanLoading}
      />

      {/* Evaluator Presets Strip */}
      <PresetStrip
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        isLoading={isTelemetryLoading || isPlanLoading}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error State Banner */}
        {errorMessage && (
          <div className="p-4 rounded-md bg-rose-50 border border-rose-300 text-rose-950 flex items-start justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Telemetry Service Alert</span>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => loadTelemetry(location)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-rose-300 hover:border-rose-900 rounded text-rose-950 font-semibold shrink-0 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Live Telemetry Hero */}
        <TelemetryHero
          snapshot={snapshot}
          isLoading={isTelemetryLoading}
          onRefresh={() => loadTelemetry(location)}
        />

        {/* Household & Lifestyle Profiler Toolbar */}
        <HouseholdProfiler
          profile={profile}
          onChangeProfile={handleChangeProfile}
          onApplyPlan={handleApplyPlan}
          isPlanLoading={isPlanLoading}
        />

        {/* Workspace Modules (Tabs) */}
        {snapshot && (
          <WorkspaceTabs
            snapshot={snapshot}
            profile={profile}
            plan={plan}
            analytics={analytics}
            isPlanLoading={isPlanLoading}
          />
        )}
      </main>

      {/* Semantic Footer */}
      <footer className="border-t border-[#E2DFD6] bg-[#FFFFFF] py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-[#6E7582]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#14181F]">VayuPlan</span>
            <span>•</span>
            <span>Google Prompt Wars Challenge 6</span>
            <span>•</span>
            <span>CPCB NAQI Technical Reference</span>
          </div>

          <div className="text-[11px] text-[#7A8290]">
            Ground Station Telemetry via WAQI & Open-Meteo CAMS • Grounded AI via Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
