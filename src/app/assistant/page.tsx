"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

const STORAGE_KEY_LOCATION = "vayuplan_location";
const STORAGE_KEY_PROFILE = "vayuplan_profile";

function AssistantWorkspaceContent() {
  const searchParams = useSearchParams();
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

  useEffect(() => {
    return () => {
      activeTelemetryAbortRef.current?.abort();
      activePlanAbortRef.current?.abort();
    };
  }, []);

  const loadTelemetry = useCallback(async (loc: ResolvedLocation) => {
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
  }, []);

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

  // Resolve initial state from query params (?preset= or ?lat=&lon=&name=&state=) or localStorage
  useEffect(() => {
    const presetParam = searchParams.get("preset");
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const nameParam = searchParams.get("name");
    const stateParam = searchParams.get("state");

    let initialLoc = defaultPreset.location;
    let initialProf = defaultPreset.profile;

    try {
      if (presetParam && presetParam in EVALUATOR_PRESETS) {
        const matched = EVALUATOR_PRESETS[presetParam];
        initialLoc = matched.location;
        initialProf = matched.profile;
        setLocation(initialLoc);
        setProfile(initialProf);
        setActivePresetId(matched.id);

        try {
          localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(initialLoc));
          localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(initialProf));
        } catch {
          // Ignore storage quota issues
        }
      } else if (latParam && lonParam && nameParam && nameParam.trim()) {
        const parsedLat = parseFloat(latParam);
        const parsedLon = parseFloat(lonParam);
        if (isFinite(parsedLat) && isFinite(parsedLon)) {
          initialLoc = {
            name: nameParam.trim(),
            state: stateParam?.trim() || "India",
            country: "India",
            lat: parsedLat,
            lon: parsedLon,
          };
          setLocation(initialLoc);
          setActivePresetId(null);

          const savedProf = localStorage.getItem(STORAGE_KEY_PROFILE);
          if (savedProf) {
            const parsedProf = JSON.parse(savedProf);
            if (parsedProf.persona && parsedProf.currentCommuteMode) {
              initialProf = parsedProf;
              setProfile(parsedProf);
            }
          }
        }
      } else {
        const savedLoc = localStorage.getItem(STORAGE_KEY_LOCATION);
        const savedProf = localStorage.getItem(STORAGE_KEY_PROFILE);

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
      }
    } catch {
      // Fallback cleanly to defaultPreset
    }

    loadTelemetry(initialLoc).then((snap) => {
      if (snap) {
        loadPlan(snap, initialProf);
      }
    });
  }, [
    searchParams,
    loadTelemetry,
    loadPlan,
    defaultPreset.location,
    defaultPreset.profile,
  ]);

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

  const handleSelectPreset = async (preset: EvaluatorPreset) => {
    setLocation(preset.location);
    setProfile(preset.profile);
    setActivePresetId(preset.id);

    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(preset.location));
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(preset.profile));
    } catch {
      // Ignore quota error
    }

    const snap = await loadTelemetry(preset.location);
    if (snap) {
      loadPlan(snap, preset.profile);
    }
  };

  const handleChangeProfile = (updatedProfile: HouseholdProfile) => {
    setProfile(updatedProfile);
    setActivePresetId(null);
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));
    } catch {
      // Ignore quota error
    }
  };

  const handleApplyPlan = () => {
    if (snapshot) {
      loadPlan(snapshot, profile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <a href="#main-content" className="skip-to-content sr-only focus:not-sr-only">
        Skip to main content
      </a>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Back-to-overview micro-navigation strip */}
      <div className="bg-[#0F172A] text-[#FFFFFF] text-xs px-4 sm:px-6 lg:px-8 py-1.5 border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#CBD5E1] hover:text-[#FFFFFF] transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
          <span className="font-mono text-[11px] text-[#94A3B8]">
            Air Intelligence Workspace
          </span>
        </div>
      </div>

      <TopBar
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        isLoading={isTelemetryLoading || isPlanLoading}
      />

      <PresetStrip
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        isLoading={isTelemetryLoading || isPlanLoading}
      />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        {errorMessage && (
          <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] flex items-start justify-between gap-3 text-xs elevation-1">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Telemetry Service Alert</span>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => loadTelemetry(location)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#FCA5A5] hover:border-[#991B1B] rounded text-[#991B1B] font-semibold shrink-0 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <TelemetryHero
          snapshot={snapshot}
          isLoading={isTelemetryLoading}
          onRefresh={() => loadTelemetry(location)}
        />

        <HouseholdProfiler
          profile={profile}
          onChangeProfile={handleChangeProfile}
          onApplyPlan={handleApplyPlan}
          isPlanLoading={isPlanLoading}
        />

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

      <footer className="border-t border-[#DCE3EC] bg-[#FFFFFF] py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-[#525E70]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F172A]">VayuPlan</span>
            <span>•</span>
            <span>Google Prompt Wars Challenge 6</span>
            <span>•</span>
            <span>CPCB NAQI Technical Reference</span>
          </div>

          <div className="text-[11px] text-[#525E70]">
            Ground Station Telemetry via WAQI & Open-Meteo CAMS • Grounded AI via Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-8 text-sm text-[#525E70]">
          Loading VayuPlan workspace...
        </div>
      }
    >
      <AssistantWorkspaceContent />
    </Suspense>
  );
}
