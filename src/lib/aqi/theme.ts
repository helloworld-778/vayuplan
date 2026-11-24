/**
 * Accessible Indian CPCB NAQI Theme & Visual Severity Encoding (DESIGN.md).
 *
 * All 6 categories map to WCAG AA compliant badge colors (contrast >= 4.5:1),
 * distinct semantic Lucide icons, and explicit text labels.
 * Severe conditions are never communicated via color alone.
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
  // High contrast WCAG AA background, text, border
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  // Subtle card surface tint
  surfaceBg: string;
  surfaceBorder: string;
  // Accent indicator
  accentColor: string;
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
    healthPosture:
      "Severe health hazard. Affects healthy people and seriously impacts sensitive groups.",
    shortAdvice: "Public health emergency posture. Stay indoors with HEPA filtration.",
  },
};

export function getNaqiTheme(category: NaqiCategory): NaqiThemeConfig {
  return NAQI_THEMES[category] || NAQI_THEMES.Moderate;
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
