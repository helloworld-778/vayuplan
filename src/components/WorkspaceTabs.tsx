"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { RoutinePlanner } from "./RoutinePlanner";
import { CommuteOptimizer } from "./CommuteOptimizer";
import { IndoorActionLab } from "./IndoorActionLab";
import { AnalyticalTabKey } from "./TodaysSmartBrief";
import { Calendar, Car, Home, AlertCircle, RefreshCw } from "lucide-react";

interface WorkspaceTabsProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  plan: AssistantPlanResponse | null;
  analytics: ComputedAnalytics | null;
  isPlanLoading: boolean;
  planError?: string | null;
  onRetryPlan?: () => void;
  activeTab?: AnalyticalTabKey;
  onTabChange?: (tab: AnalyticalTabKey) => void;
}

interface TabMeta {
  key: AnalyticalTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const TABS: TabMeta[] = [
  { key: "routine", label: "Daily Routine & Safe Hours", icon: Calendar },
  { key: "commute", label: "Commute & Emissions", icon: Car },
  { key: "indoor", label: "Indoor Action Lab", icon: Home },
];

export function WorkspaceTabs({
  snapshot,
  profile,
  plan,
  analytics,
  isPlanLoading,
  planError = null,
  onRetryPlan,
  activeTab: controlledTab,
  onTabChange,
}: WorkspaceTabsProps) {
  const [internalTab, setInternalTab] = useState<AnalyticalTabKey>("routine");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeTab = controlledTab ?? internalTab;

  const selectTab = (nextTab: AnalyticalTabKey) => {
    if (onTabChange) {
      onTabChange(nextTab);
    } else {
      setInternalTab(nextTab);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex: number | null = null;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = TABS.length - 1;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      selectTab(TABS[targetIndex].key);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Animated Tab Navigation Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl px-2 pt-2 elevation-1">
        <div
          role="tablist"
          aria-label="VayuPlan workspace modules"
          className="flex items-center gap-1 overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(tab.key)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`relative flex items-center gap-2 py-3 px-4 min-h-[44px] text-xs font-semibold transition-colors whitespace-nowrap rounded-t-lg ${
                  isActive
                    ? "text-[#0F172A]"
                    : "text-[#525E70] hover:text-[#0F172A]"
                }`}
              >
                <Icon
                  aria-hidden={true}
                  className={`w-4 h-4 ${
                    isActive ? "text-[#1D4ED8]" : "text-[#525E70]"
                  }`}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="workspace-active-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1D4ED8] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div>
        {isPlanLoading && !plan ? (
          <div className="p-8 bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 space-y-4 animate-pulse">
            <div className="h-5 w-48 bg-[#F1F4F8] rounded" />
            <div className="h-48 w-full bg-[#F1F4F8] rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-24 bg-[#F1F4F8] rounded-lg" />
              <div className="h-24 bg-[#F1F4F8] rounded-lg" />
            </div>
          </div>
        ) : planError && !plan ? (
          <div
            role="alert"
            className="p-6 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#991B1B]"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">
                  Unable to load personalized routine analytics
                </p>
                <p className="mt-0.5">{planError}</p>
              </div>
            </div>
            {onRetryPlan && (
              <button
                type="button"
                onClick={onRetryPlan}
                className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-lg bg-[#FFFFFF] border border-[#FCA5A5] hover:border-[#991B1B] font-semibold text-[#991B1B] shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry Plan</span>
              </button>
            )}
          </div>
        ) : plan && analytics ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "routine" && (
                <RoutinePlanner
                  snapshot={snapshot}
                  plan={plan}
                  analytics={analytics}
                />
              )}

              {activeTab === "commute" && (
                <CommuteOptimizer
                  snapshot={snapshot}
                  profile={profile}
                  plan={plan}
                  analytics={analytics}
                />
              )}

              {activeTab === "indoor" && (
                <IndoorActionLab
                  snapshot={snapshot}
                  profile={profile}
                  plan={plan}
                  analytics={analytics}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="p-8 text-center bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 space-y-3">
            <p className="text-xs text-[#525E70]">
              No plan available. Refresh telemetry or regenerate the household plan.
            </p>
            {onRetryPlan && (
              <button
                type="button"
                onClick={onRetryPlan}
                className="inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-lg border border-[#64748B]/70 bg-[#FFFFFF] text-xs font-semibold text-[#0F172A] hover:border-[#1D4ED8]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
                <span>Generate Plan</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
