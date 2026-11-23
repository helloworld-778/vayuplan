"use client";

import React, { useState } from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { RoutinePlanner } from "./RoutinePlanner";
import { CommuteOptimizer } from "./CommuteOptimizer";
import { IndoorActionLab } from "./IndoorActionLab";
import { GroundedChat } from "./GroundedChat";
import { Calendar, Car, Home, MessageSquare } from "lucide-react";

interface WorkspaceTabsProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  plan: AssistantPlanResponse | null;
  analytics: ComputedAnalytics | null;
  isPlanLoading: boolean;
}

type TabKey = "routine" | "commute" | "indoor" | "chat";

interface TabMeta {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const TABS: TabMeta[] = [
  { key: "routine", label: "Daily Routine & Safe Hours", icon: Calendar },
  { key: "commute", label: "Commute & Emissions", icon: Car },
  { key: "indoor", label: "Indoor Action Lab", icon: Home },
  { key: "chat", label: "Ask VayuPlan", icon: MessageSquare, tag: "AI Q&A" },
];

export function WorkspaceTabs({
  snapshot,
  profile,
  plan,
  analytics,
  isPlanLoading,
}: WorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("routine");

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % TABS.length;
      setActiveTab(TABS[nextIndex].key);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[prevIndex].key);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="border-b border-[#E2DFD6] bg-[#FFFFFF] rounded-t-lg px-2 pt-2 shadow-2xs">
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
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap outline-none ${
                  isActive
                    ? "border-[#14181F] text-[#14181F] bg-[#FAF9F6] rounded-t-md font-bold"
                    : "border-transparent text-[#5E6470] hover:text-[#14181F] hover:bg-[#FAF9F6]/60 rounded-t-md"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#14181F]" : "text-[#7A8290]"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.tag && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFECE6] text-[#474D58]">
                    {tab.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div>
        {isPlanLoading && !plan ? (
          <div className="p-12 text-center bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg">
            <div className="animate-spin w-6 h-6 border-2 border-[#14181F] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs text-[#5E6470]">
              Synthesizing environmental physics & AI recommendations...
            </p>
          </div>
        ) : plan && analytics ? (
          <>
            <div
              role="tabpanel"
              id="tabpanel-routine"
              aria-labelledby="tab-routine"
              hidden={activeTab !== "routine"}
            >
              {activeTab === "routine" && (
                <RoutinePlanner
                  snapshot={snapshot}
                  plan={plan}
                  analytics={analytics}
                />
              )}
            </div>

            <div
              role="tabpanel"
              id="tabpanel-commute"
              aria-labelledby="tab-commute"
              hidden={activeTab !== "commute"}
            >
              {activeTab === "commute" && (
                <CommuteOptimizer
                  snapshot={snapshot}
                  profile={profile}
                  plan={plan}
                  analytics={analytics}
                />
              )}
            </div>

            <div
              role="tabpanel"
              id="tabpanel-indoor"
              aria-labelledby="tab-indoor"
              hidden={activeTab !== "indoor"}
            >
              {activeTab === "indoor" && (
                <IndoorActionLab
                  snapshot={snapshot}
                  profile={profile}
                  plan={plan}
                  analytics={analytics}
                />
              )}
            </div>

            <div
              role="tabpanel"
              id="tabpanel-chat"
              aria-labelledby="tab-chat"
              hidden={activeTab !== "chat"}
            >
              {activeTab === "chat" && (
                <GroundedChat snapshot={snapshot} profile={profile} />
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg text-xs text-[#7A8290]">
            No plan available. Please refresh or select a preset.
          </div>
        )}
      </div>
    </div>
  );
}
