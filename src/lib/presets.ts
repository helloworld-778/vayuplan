/**
 * Pan-India Evaluator Presets for VayuPlan.
 *
 * Provides 4 realistic Indian resident personas and locations for 1-click evaluation.
 * Contains ONLY geographical coordinates and household profiles — NO hardcoded AQI numbers.
 */

import { HouseholdProfile, ResolvedLocation } from "@/types/air-quality";

export interface EvaluatorPreset {
  id: string;
  title: string;
  description: string;
  location: ResolvedLocation;
  profile: HouseholdProfile;
}

export const EVALUATOR_PRESETS: Record<string, EvaluatorPreset> = {
  "delhi-commuter": {
    id: "delhi-commuter",
    title: "Delhi Corporate Commuter",
    description:
      "Working professional in New Delhi commuting 14 km via petrol car; manages daily peak traffic exhaust.",
    location: {
      name: "New Delhi",
      state: "Delhi",
      country: "India",
      lat: 28.6139,
      lon: 77.209,
    },
    profile: {
      persona: "commuter",
      hasRespiratorySensitivity: false,
      commuteDistanceKm: 14,
      currentCommuteMode: "petrol_car",
      maskType: "surgical",
      hasAirPurifier: false,
      windowsState: "cracked",
      usesIncenseOrSolidFuel: false,
    },
  },

  "mumbai-family": {
    id: "mumbai-family",
    title: "Mumbai Coastal Family",
    description:
      "Household with young children near maritime humidity; managing morning school carpools and daily prayer incense.",
    location: {
      name: "Mumbai",
      state: "Maharashtra",
      country: "India",
      lat: 19.076,
      lon: 72.8777,
    },
    profile: {
      persona: "family_with_kids",
      hasRespiratorySensitivity: true,
      commuteDistanceKm: 8,
      currentCommuteMode: "carpool",
      maskType: "cloth",
      hasAirPurifier: true,
      windowsState: "open",
      usesIncenseOrSolidFuel: true,
    },
  },

  "kolkata-senior": {
    id: "kolkata-senior",
    title: "Kolkata Homebound Senior",
    description:
      "Senior citizen with chronic asthma living in central Kolkata with open natural ventilation and evening incense.",
    location: {
      name: "Kolkata",
      state: "West Bengal",
      country: "India",
      lat: 22.5726,
      lon: 88.3639,
    },
    profile: {
      persona: "senior_citizen",
      hasRespiratorySensitivity: true,
      commuteDistanceKm: 0,
      currentCommuteMode: "work_from_home",
      maskType: "none",
      hasAirPurifier: false,
      windowsState: "open",
      usesIncenseOrSolidFuel: true,
    },
  },

  "bengaluru-student": {
    id: "bengaluru-student",
    title: "Bengaluru Student Athlete",
    description:
      "College track-and-field student athlete commuting across town on a scooter exposed to direct vehicular road plumes.",
    location: {
      name: "Bengaluru",
      state: "Karnataka",
      country: "India",
      lat: 12.9716,
      lon: 77.5946,
    },
    profile: {
      persona: "student_athlete",
      hasRespiratorySensitivity: false,
      commuteDistanceKm: 6,
      currentCommuteMode: "two_wheeler",
      maskType: "none",
      hasAirPurifier: false,
      windowsState: "cracked",
      usesIncenseOrSolidFuel: false,
    },
  },
};
