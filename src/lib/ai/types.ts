import { ExposureWindowsAnalysis } from "@/lib/calculators/exposure-windows";
import { CommuteAnalysis } from "@/lib/calculators/commute-impact";
import { IndoorAirAnalysis } from "@/lib/calculators/indoor-air";

export interface ComputedAnalytics {
  exposureWindows: ExposureWindowsAnalysis;
  commuteImpact: CommuteAnalysis;
  indoorAir: IndoorAirAnalysis;
}
