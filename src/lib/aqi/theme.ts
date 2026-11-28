/**
 * Accessible Indian CPCB NAQI Theme & Visual Severity Encoding (DESIGN.md).
 *
 * All 6 categories map to WCAG AA compliant light & dark-obsidian badge colors
 * (contrast >= 4.5:1), distinct semantic Lucide icons, and explicit text labels.
 * Severity is never communicated via color alone.
 */

import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Flame,
  AlertOctagon,
  LucideIcon,
} from "lucide-react";
import { NaqiCategory } from "@/types/air-quality";

export interface NaqiThemeConfig {
  category: NaqiCategory;
  label: string;
  rangeLabel: string;
  icon: LucideIcon;
  // Light-surface WCAG AA badge & card tint
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  surfaceBg: string;
  surfaceBorder: string;
  accentColor: string;
  // Dark-obsidian (#0B1412 / #13201D) WCAG AA+ badge & gauge tokens
  darkBadgeBg: string;
  darkText: string;
  darkAccentColor: string;
  darkAmbientWash: string;
  // Official CPCB health posture statement
  healthPosture: string;
  shortAdvice: string;
}

export const NAQI_THEMES: Record<NaqiCategory, NaqiThemeConfig> = {
  Good: {
    category: "Good",
    label: "Good",
    rangeLabel: "0 – 50",
    icon: ShieldCheck,
    badgeBg: "bg-[#ECFDF5] text-[#065F46] border-[#6EE7B7]",
    badgeText: "text-[#065F46]",
    badgeBorder: "border-[#6EE7B7]",
    surfaceBg: "bg-[#ECFDF5]/60",
    surfaceBorder: "border-[#6EE7B7]",
    accentColor: "#059669",
    darkBadgeBg: "bg-[#0F2922] text-[#6EE7B7] border-[#2A6E5C]",
    darkText: "text-[#6EE7B7]",
    darkAccentColor: "#6EE7B7",
    darkAmbientWash:
      "radial-gradient(circle at 22% 45%, rgba(110, 231, 183, 0.14), rgba(15, 41, 34, 0.04) 55%, transparent 78%)",
    healthPosture: "Minimal health impact. Clean, restorative ambient air.",
    shortAdvice: "Ideal for outdoor activities and home ventilation.",
  },
  Satisfactory: {
    category: "Satisfactory",
    label: "Satisfactory",
    rangeLabel: "51 – 100",
    icon: CheckCircle2,
    badgeBg: "bg-[#ECFCCB] text-[#3F6212] border-[#BEF264]",
    badgeText: "text-[#3F6212]",
    badgeBorder: "border-[#BEF264]",
    surfaceBg: "bg-[#ECFCCB]/50",
    surfaceBorder: "border-[#BEF264]",
    accentColor: "#65A30D",
    darkBadgeBg: "bg-[#1F2C12] text-[#BEF264] border-[#4A6B27]",
    darkText: "text-[#BEF264]",
    darkAccentColor: "#BEF264",
    darkAmbientWash:
      "radial-gradient(circle at 22% 45%, rgba(190, 242, 100, 0.12), rgba(31, 44, 18, 0.04) 55%, transparent 78%)",
    healthPosture: "Minor breathing discomfort may affect sensitive individuals.",
    shortAdvice: "Safe for most; sensitive groups monitor prolonged outdoor exertion.",
  },
  Moderate: {
    category: "Moderate",
    label: "Moderate",
    rangeLabel: "101 – 200",
    icon: AlertTriangle,
    badgeBg: "bg-[#FFFBEB] text-[#92400E] border-[#FCD34D]",
    badgeText: "text-[#92400E]",
    badgeBorder: "border-[#FCD34D]",
    surfaceBg: "bg-[#FFFBEB]/60",
    surfaceBorder: "border-[#FCD34D]",
    accentColor: "#D97706",
    darkBadgeBg: "bg-[#2D210B] text-[#FCD34D] border-[#6E5118]",
    darkText: "text-[#FCD34D]",
    darkAccentColor: "#FCD34D",
    darkAmbientWash:
      "radial-gradient(circle at 22% 45%, rgba(252, 211, 77, 0.13), rgba(45, 33, 11, 0.04) 55%, transparent 78%)",
    healthPosture:
      "Breathing discomfort to people with lung disease, asthma, and heart conditions.",
    shortAdvice: "Limit heavy outdoor cardio; keep windows mostly sealed.",
  },
  Poor: {
    category: "Poor",
    label: "Poor",
    rangeLabel: "201 – 300",
    icon: AlertCircle,
    badgeBg: "bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]",
    badgeText: "text-[#9A3412]",
    badgeBorder: "border-[#FDBA74]",
    surfaceBg: "bg-[#FFF7ED]/60",
    surfaceBorder: "border-[#FDBA74]",
    accentColor: "#EA580C",
    darkBadgeBg: "bg-[#311A0B] text-[#FDBA74] border-[#78401A]",
    darkText: "text-[#FDBA74]",
    darkAccentColor: "#FDBA74",
    darkAmbientWash:
      "radial-gradient(circle at 22% 45%, rgba(253, 186, 116, 0.14), rgba(49, 26, 11, 0.04) 55%, transparent 78%)",
    healthPosture: "Breathing discomfort to most people on prolonged exposure.",
    shortAdvice: "Avoid active outdoor transit; N95 mask required outdoors.",
  },
  "Very Poor": {
    category: "Very Poor",
    label: "Very Poor",
    rangeLabel: "301 – 400",
    icon: Flame,
    badgeBg: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]",
    badgeText: "text-[#991B1B]",
    badgeBorder: "border-[#FCA5A5]",
    surfaceBg: "bg-[#FEF2F2]/60",
    surfaceBorder: "border-[#FCA5A5]",
    accentColor: "#DC2626",
    darkBadgeBg: "bg-[#331214] text-[#FCA5A5] border-[#7F292E]",
    darkText: "text-[#FCA5A5]",
    darkAccentColor: "#FCA5A5",
    darkAmbientWash:
      "radial-gradient(circle at 22% 45%, rgba(252, 165, 165, 0.14), rgba(51, 18, 20, 0.04) 55%, transparent 78%)",
    healthPosture:
      "Respiratory illness on prolonged exposure; severe effect on sensitive groups.",
    shortAdvice: "Strictly minimize outdoor time; seal indoor living spaces.",
  },
  Severe: {
    category: "Severe",
    label: "Severe",
    rangeLabel: "401 – 500+",
    icon: AlertOctagon,
    badgeBg: "bg-[#FAF5FF] text-[#581C87] border-[#D8B4FE]",
    badgeText: "text-[#581C87]",
    badgeBorder: "border-[#D8B4FE]",
    surfaceBg: "bg-[#FAF5FF]/60",
    surfaceBorder: "border-[#D8B4FE]",
    accentColor: "#7C3AED",
    darkBadgeBg: "bg-[#241433] text-[#D8B4FE] border-[#5D3382]",
    darkText: "text-[#D8B4FE]",
    darkAccentColor: "#D8B4FE",
    darkAmbientWash:
      "radial-gradient(circle at 22% 45%, rgba(216, 180, 254, 0.14), rgba(36, 20, 51, 0.04) 55%, transparent 78%)",
    healthPosture:
      "Severe health hazard. Affects healthy people and seriously impacts sensitive groups.",
    shortAdvice: "Public health emergency posture. Stay indoors with HEPA filtration.",
  },
};

export function getNaqiTheme(category: NaqiCategory): NaqiThemeConfig {
  return NAQI_THEMES[category] || NAQI_THEMES.Moderate;
}

/**
 * Returns surface-calibrated NAQI classes for light or dark-obsidian contexts.
 */
export function getNaqiBadgeClass(
  category: NaqiCategory,
  surface: "light" | "dark" = "light"
): string {
  const theme = getNaqiTheme(category);
  return surface === "dark" ? theme.darkBadgeBg : theme.badgeBg;
}

/**
 * Returns formatted Indian Standard Time (IST) string from ISO-8601 timestamp.
 */
export function formatIstTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}
