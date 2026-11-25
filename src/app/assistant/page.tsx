"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
  ResolvedLocation,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { EVALUATOR_PRESETS, EvaluatorPreset } from "@/lib/presets";
import { TopBar } from "@/components/TopBar";
import { TelemetryHero } from "@/components/TelemetryHero";
import {
  TodaysSmartBrief,
  AnalyticalTabKey,
} from "@/components/TodaysSmartBrief";
import { HouseholdProfiler } from "@/components/HouseholdProfiler";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { GroundedChat, ChatMessage } from "@/components/GroundedChat";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";

const STORAGE_KEY_LOCATION = "vayuplan_location";
const STORAGE_KEY_PROFILE = "vayuplan_profile";

function AssistantWorkspaceContent() {
  const searchParams = useSearchParams();
  const defaultPreset = EVALUATOR_PRESETS["delhi-commuter"];

  const [location, setLocation] = useState<ResolvedLocation>(
    defaultPreset.location
  );
  const [profile, setProfile] = useState<HouseholdProfile>(
    defaultPreset.profile
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    "delhi-commuter"
  );

  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [plan, setPlan] = useState<AssistantPlanResponse | null>(null);
  const [analytics, setAnalytics] = useState<ComputedAnalytics | null>(null);

  const [activeTab, setActiveTab] = useState<AnalyticalTabKey>("routine");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copilotPrefill, setCopilotPrefill] = useState<{
    text: string;
    seq: number;
  } | null>(null);
  const [isMobileCopilotOpen, setIsMobileCopilotOpen] = useState(false);

  const [isTelemetryLoading, setIsTelemetryLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const activeTelemetryAbortRef = useRef<AbortController | null>(null);
  const activePlanAbortRef = useRef<AbortController | null>(null);
  const tabsSectionRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      activeTelemetryAbortRef.current?.abort();
      activePlanAbortRef.current?.abort();
    };
  }, []);

  // Accessible mobile Copilot dialog: body scroll lock, initial focus, Tab trap & Escape restore
  useEffect(() => {
    if (!isMobileCopilotOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      const dialog = mobileDialogRef.current;
      if (!dialog) return;
      const input = dialog.querySelector<HTMLInputElement>(
        'input[type="text"]'
      );
      if (input) {
        input.focus();
      } else {
        dialog.focus();
      }
    }, 50);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileCopilotOpen(false);
        mobileTriggerRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && mobileDialogRef.current) {
        const focusables = mobileDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isMobileCopilotOpen]);

  const loadTelemetry = useCallback(async (loc: ResolvedLocation) => {
    if (activeTelemetryAbortRef.current) {
      activeTelemetryAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeTelemetryAbortRef.current = controller;

    setIsTelemetryLoading(true);
    setErrorMessage(null);
    setPlanError(null);
    setLiveAnnouncement(
      `Fetching live air quality telemetry for ${loc.name}...`
    );

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
      const msg =
        (err as Error).message || "Atmospheric telemetry service unreachable.";
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
      setPlanError(null);
      setLiveAnnouncement(
        "Updating personalized plan and environmental calculations..."
      );

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
        setPlanError(null);
        setLiveAnnouncement("Personalized air quality plan updated.");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        const msg =
          (err as Error).message || "Unable to synthesize household plan.";
        setPlanError(msg);
        setLiveAnnouncement(`Plan update issue: ${msg}`);
      } finally {
        if (activePlanAbortRef.current === controller) {
          setIsPlanLoading(false);
        }
      }
    },
    []
  );

  const searchParamsKey = searchParams.toString();

  // Hydrate initial location/profile from URL query params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const presetParam = params.get("preset");
    const latParam = params.get("lat");
    const lonParam = params.get("lon");
    const nameParam = params.get("name");
    const stateParam = params.get("state");

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
    searchParamsKey,
    loadTelemetry,
    loadPlan,
    defaultPreset.location,
    defaultPreset.profile,
  ]);

  const handleSelectLocation = async (newLoc: ResolvedLocation) => {
    setLocation(newLoc);
    setActivePresetId(null);
    setChatMessages([]);
    setPlan(null);
    setAnalytics(null);
    setPlanError(null);
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
    setChatMessages([]);
    setPlan(null);
    setAnalytics(null);
    setPlanError(null);

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

  const handleApplyPlan = (nextProfile?: HouseholdProfile) => {
    const targetProfile = nextProfile ?? profile;
    if (snapshot) {
      loadPlan(snapshot, targetProfile);
    }
  };

  const handleRetryPlan = () => {
    if (snapshot) {
      loadPlan(snapshot, profile);
    }
  };

  const handleJumpToTab = (tab: AnalyticalTabKey) => {
    setActiveTab(tab);
    if (typeof tabsSectionRef.current?.scrollIntoView === "function") {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      tabsSectionRef.current.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "nearest",
      });
    }
  };

  const handleAskCopilot = (prompt: string) => {
    setCopilotPrefill((prev) => ({
      text: prompt,
      seq: (prev?.seq ?? 0) + 1,
    }));
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileCopilotOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#0F172A] overflow-x-clip">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      <TopBar
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        isLoading={isTelemetryLoading}
      />

      <main
        id="main-content"
        className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] flex flex-wrap items-start justify-between gap-3 text-xs elevation-1"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <span className="font-semibold block text-sm">
                  Telemetry Service Alert
                </span>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadTelemetry(location)}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] bg-[#FFFFFF] border border-[#FCA5A5] hover:border-[#991B1B] rounded-lg text-[#991B1B] font-semibold shrink-0 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Collapsible Household Context Bar */}
        <HouseholdProfiler
          profile={profile}
          onChangeProfile={handleChangeProfile}
          onApplyPlan={handleApplyPlan}
          isPlanLoading={isPlanLoading}
        />

        {/* Two-Column AI-First Split Cockpit (Left Column strictly vertically stacked — zero 3-col squeeze) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
          {/* Left Primary Intelligence Column */}
          <div className="min-w-0 space-y-6">
            <TelemetryHero
              snapshot={snapshot}
              isLoading={isTelemetryLoading}
              onRefresh={() => loadTelemetry(location)}
            />

            {snapshot ? (
              <TodaysSmartBrief
                snapshot={snapshot}
                profile={profile}
                plan={plan}
                analytics={analytics}
                isPlanLoading={isPlanLoading}
                planError={planError}
                onRetryPlan={handleRetryPlan}
                onJumpToTab={handleJumpToTab}
                onAskCopilot={handleAskCopilot}
              />
            ) : (
              <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 elevation-1 animate-pulse space-y-4">
                <div className="h-5 w-40 bg-[#F1F4F8] rounded" />
                <div className="h-4 w-full bg-[#F1F4F8] rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="h-20 bg-[#F1F4F8] rounded-lg" />
                  <div className="h-20 bg-[#F1F4F8] rounded-lg" />
                  <div className="h-20 bg-[#F1F4F8] rounded-lg" />
                </div>
              </div>
            )}

            {/* 3 Focused Analytical Tabs */}
            {snapshot && (
              <div ref={tabsSectionRef}>
                <WorkspaceTabs
                  snapshot={snapshot}
                  profile={profile}
                  plan={plan}
                  analytics={analytics}
                  isPlanLoading={isPlanLoading}
                  planError={planError}
                  onRetryPlan={handleRetryPlan}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            )}
          </div>

          {/* Right Persistent AI Copilot Rail (lg+ desktop viewports) */}
          <aside
            aria-label="Ask VayuPlan AI Copilot"
            className="hidden lg:block sticky top-[84px]"
          >
            {snapshot ? (
              <GroundedChat
                snapshot={snapshot}
                profile={profile}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                prefillRequest={copilotPrefill}
                className="h-[calc(100vh-100px)]"
              />
            ) : (
              <div className="h-[calc(100vh-100px)] bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-2 p-5 animate-pulse space-y-4">
                <div className="h-10 bg-[#F1F4F8] rounded-lg" />
                <div className="h-24 bg-[#F1F4F8] rounded-lg" />
                <div className="h-12 bg-[#F1F4F8] rounded-lg" />
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile / Tablet Floating Copilot Trigger (<1024px) */}
      {snapshot && (
        <div className="lg:hidden fixed bottom-5 right-5 z-40">
          <motion.button
            whileTap={{ scale: 0.96 }}
            ref={mobileTriggerRef}
            type="button"
            onClick={() => setIsMobileCopilotOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMobileCopilotOpen}
            className="inline-flex items-center gap-2 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-[#FFFFFF] px-5 min-h-[48px] text-sm font-semibold elevation-3 transition-colors"
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ask VayuPlan AI</span>
          </motion.button>
        </div>
      )}

      {/* Mobile / Tablet Slide-Up Copilot Drawer */}
      <AnimatePresence>
        {isMobileCopilotOpen && snapshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsMobileCopilotOpen(false);
                mobileTriggerRef.current?.focus();
              }
            }}
            className="lg:hidden fixed inset-0 z-50 bg-[#0F172A]/45 flex items-end justify-center overscroll-contain"
          >
            <motion.div
              ref={mobileDialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Ask VayuPlan AI Copilot"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl h-[85vh] rounded-t-2xl overflow-hidden elevation-3"
            >
              <GroundedChat
                snapshot={snapshot}
                profile={profile}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                prefillRequest={copilotPrefill}
                onCloseDrawer={() => {
                  setIsMobileCopilotOpen(false);
                  mobileTriggerRef.current?.focus();
                }}
                className="h-full rounded-none border-0 rounded-t-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-[#DCE3EC] bg-[#FFFFFF] py-6 px-4 sm:px-6 lg:px-8 mt-10 text-xs text-[#525E70]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-[#0F172A]">VayuPlan</span>
            <span aria-hidden="true">·</span>
            <span>CPCB NAQI Technical Reference</span>
            <span aria-hidden="true">·</span>
            <span>Informational guidance only, not medical advice</span>
          </div>

          <div className="text-xs text-[#525E70]">
            Ground Station Telemetry via WAQI &amp; Open-Meteo CAMS · Grounded AI via Gemini
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
