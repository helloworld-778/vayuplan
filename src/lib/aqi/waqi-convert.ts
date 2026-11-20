/**
 * WAQI / US EPA AQI to Raw Concentration (µg/m³) Inverse Converter.
 *
 * WAQI reports individual pollutant sub-indices (`iaqi.pm25.v`, `iaqi.pm10.v`)
 * scaled to the US EPA Air Quality Index system, NOT raw concentration in µg/m³.
 *
 * To properly compute the official Indian National Air Quality Index (CPCB NAQI),
 * we must first invert the US EPA piecewise linear interpolation to recover raw µg/m³:
 *   C_p = ((I_p - I_Lo) / (I_Hi - I_Lo)) * (BP_Hi - BP_Lo) + BP_Lo
 */

interface EpaBreakpoint {
  cLo: number; // Concentration low (µg/m³)
  cHi: number; // Concentration high (µg/m³)
  iLo: number; // Index low
  iHi: number; // Index high
}

// US EPA PM2.5 Breakpoints
const EPA_PM25_BREAKPOINTS: EpaBreakpoint[] = [
  { cLo: 0.0, cHi: 12.0, iLo: 0, iHi: 50 },
  { cLo: 12.1, cHi: 35.4, iLo: 51, iHi: 100 },
  { cLo: 35.5, cHi: 55.4, iLo: 101, iHi: 150 },
  { cLo: 55.5, cHi: 150.4, iLo: 151, iHi: 200 },
  { cLo: 150.5, cHi: 250.4, iLo: 201, iHi: 300 },
  { cLo: 250.5, cHi: 350.4, iLo: 301, iHi: 400 },
  { cLo: 350.5, cHi: 500.4, iLo: 401, iHi: 500 },
];

// US EPA PM10 Breakpoints
const EPA_PM10_BREAKPOINTS: EpaBreakpoint[] = [
  { cLo: 0, cHi: 54, iLo: 0, iHi: 50 },
  { cLo: 55, cHi: 154, iLo: 51, iHi: 100 },
  { cLo: 155, cHi: 254, iLo: 101, iHi: 150 },
  { cLo: 255, cHi: 354, iLo: 151, iHi: 200 },
  { cLo: 355, cHi: 424, iLo: 201, iHi: 300 },
  { cLo: 425, cHi: 504, iLo: 301, iHi: 400 },
  { cLo: 505, cHi: 604, iLo: 401, iHi: 500 },
];

function invertEpaAqi(aqi: number, breakpoints: EpaBreakpoint[]): number {
  if (typeof aqi !== "number" || isNaN(aqi) || aqi <= 0) {
    return 0;
  }

  for (let i = 0; i < breakpoints.length; i++) {
    const { cLo, cHi, iLo, iHi } = breakpoints[i];
    const inBracket = i === 0 ? aqi >= 0 && aqi <= iHi : aqi >= iLo && aqi <= iHi;

    if (inBracket) {
      const concentration =
        ((aqi - iLo) / (iHi - iLo)) * (cHi - cLo) + cLo;
      return Number(concentration.toFixed(1));
    }
  }

  // Beyond 500 AQI: linear extrapolation from the highest bracket
  const top = breakpoints[breakpoints.length - 1];
  const extrapolated =
    ((aqi - top.iLo) / (top.iHi - top.iLo)) * (top.cHi - top.cLo) + top.cLo;
  return Number(extrapolated.toFixed(1));
}

/**
 * Converts a US EPA PM2.5 AQI value to raw concentration in µg/m³.
 */
export function epaAqiToPm25UgM3(aqi: number): number {
  return invertEpaAqi(aqi, EPA_PM25_BREAKPOINTS);
}

/**
 * Converts a US EPA PM10 AQI value to raw concentration in µg/m³.
 */
export function epaAqiToPm10UgM3(aqi: number): number {
  return invertEpaAqi(aqi, EPA_PM10_BREAKPOINTS);
}
