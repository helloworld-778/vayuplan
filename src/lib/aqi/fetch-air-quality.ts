/**
 * Pan-India Live Air Quality Telemetry Engine.
 *
 * Merges CPCB / WAQI physical ground monitor stations with Open-Meteo CAMS atmospheric modeling.
 * Evaluates all raw particulate and gas concentrations through official CPCB linear interpolation equations.
 */

import {
  AirQualitySnapshot,
  HourlyAirPoint,
  PollutantReadings,
  ResolvedLocation,
} from "@/types/air-quality";
import { calculateNaqi } from "@/lib/aqi/naqi";
import { epaAqiToPm10UgM3, epaAqiToPm25UgM3 } from "@/lib/aqi/waqi-convert";
import { MemoryCache } from "@/lib/security/cache";
import { getWaqiApiToken } from "@/lib/security/env";

export class TelemetryUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelemetryUnavailableError";
  }
}

// 15-minute cache for telemetry snapshots
const telemetryCache = new MemoryCache<AirQualitySnapshot>(900000, 200);

export function getTelemetryCacheKey(lat: number, lon: number): string {
  return `aqi_${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

interface OpenMeteoAqResponse {
  current?: {
    time?: string;
    pm10?: number | null;
    pm2_5?: number | null;
    carbon_monoxide?: number | null;
    nitrogen_dioxide?: number | null;
    sulphur_dioxide?: number | null;
    ozone?: number | null;
  };
  hourly?: {
    time?: string[];
    pm10?: (number | null)[];
    pm2_5?: (number | null)[];
    carbon_monoxide?: (number | null)[];
    nitrogen_dioxide?: (number | null)[];
    sulphur_dioxide?: (number | null)[];
    ozone?: (number | null)[];
  };
}

interface WaqiResponse {
  status: string;
  data?: {
    city?: { name?: string };
    time?: { v?: number; iso?: string };
    iaqi?: {
      pm25?: { v?: number };
      pm10?: { v?: number };
      no2?: { v?: number };
      so2?: { v?: number };
      co?: { v?: number };
      o3?: { v?: number };
    };
  };
}

/**
 * Fetches live atmospheric telemetry for an Indian location.
 * Uses WAQI ground stations when available and fresh (<6h), with Open-Meteo CAMS as reliable 48h fallback.
 */
export async function fetchLiveAirQuality(
  location: ResolvedLocation
): Promise<AirQualitySnapshot> {
  const cacheKey = getTelemetryCacheKey(location.lat, location.lon);
  const cached = telemetryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { lat, lon } = location;

  // 1. Prepare Open-Meteo Air Quality URL (48-hour hourly forecast + current)
  const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(
    lon
  )}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia%2FKolkata&forecast_days=2`;

  const openMeteoPromise: Promise<OpenMeteoAqResponse | null> = fetch(
    openMeteoUrl,
    {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    }
  )
    .then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as OpenMeteoAqResponse;
    })
    .catch((err) => {
      console.warn(`[Open-Meteo] fetch failed for (${lat}, ${lon}):`, (err as Error).message);
      return null;
    });

  // 2. Prepare WAQI ground station fetch (non-blocking parallel request)
  const waqiToken = getWaqiApiToken();
  const waqiPromise: Promise<WaqiResponse | null> = waqiToken
    ? fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${waqiToken}`, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json()) as WaqiResponse;
        })
        .catch((err) => {
          console.warn(`[WAQI] fetch failed for (${lat}, ${lon}):`, (err as Error).message);
          return null;
        })
    : Promise.resolve(null);

  // Await parallel requests
  const [openMeteoData, waqiData] = await Promise.all([
    openMeteoPromise,
    waqiPromise,
  ]);

  if (!openMeteoData && !waqiData) {
    throw new TelemetryUnavailableError(
      `Unable to retrieve air quality telemetry for ${location.name}. Both ground stations and atmospheric models were unreachable.`
    );
  }

  // 3. Extract baseline readings from Open-Meteo
  let currentPm25: number | null = openMeteoData?.current?.pm2_5 ?? null;
  let currentPm10: number | null = openMeteoData?.current?.pm10 ?? null;
  const currentNo2: number | null = openMeteoData?.current?.nitrogen_dioxide ?? null;
  const currentO3: number | null = openMeteoData?.current?.ozone ?? null;
  const currentCo: number | null = openMeteoData?.current?.carbon_monoxide ?? null;
  const currentSo2: number | null = openMeteoData?.current?.sulphur_dioxide ?? null;

  let source = "Open-Meteo CAMS Air Quality Model";
  let stationName = `${location.name} Grid Telemetry`;
  let isFallback = true;

  // 4. Check if WAQI ground station is available and fresh (<6 hours old)
  if (waqiData && waqiData.status === "ok" && waqiData.data?.iaqi?.pm25?.v !== undefined) {
    const waqiTimeSec = waqiData.data.time?.v;
    const isFresh =
      !waqiTimeSec ||
      Math.abs(Date.now() / 1000 - waqiTimeSec) < 6 * 3600;

    if (isFresh) {
      // Invert US EPA AQI to raw µg/m³
      const epaPm25 = waqiData.data.iaqi.pm25.v;
      currentPm25 = epaAqiToPm25UgM3(epaPm25);

      if (waqiData.data.iaqi.pm10?.v !== undefined) {
        currentPm10 = epaAqiToPm10UgM3(waqiData.data.iaqi.pm10.v);
      }

      source = "CPCB/WAQI Ground Station + Open-Meteo Hourly Model";
      stationName = waqiData.data.city?.name || stationName;
      isFallback = false;
    }
  }

  // 5. Construct current PollutantReadings and compute official CPCB NAQI
  const currentPollutants: PollutantReadings = {
    pm25: currentPm25,
    pm10: currentPm10,
    no2: currentNo2,
    o3: currentO3,
    co: currentCo,
    so2: currentSo2,
  };

  const naqiResult = calculateNaqi(currentPollutants);

  // 6. Build hourly forecast points from Open-Meteo
  const hourlyForecast: HourlyAirPoint[] = [];

  if (openMeteoData?.hourly?.time && Array.isArray(openMeteoData.hourly.time)) {
    const times = openMeteoData.hourly.time;
    const pm25Arr = openMeteoData.hourly.pm2_5 || [];
    const pm10Arr = openMeteoData.hourly.pm10 || [];
    const no2Arr = openMeteoData.hourly.nitrogen_dioxide || [];
    const o3Arr = openMeteoData.hourly.ozone || [];
    const coArr = openMeteoData.hourly.carbon_monoxide || [];
    const so2Arr = openMeteoData.hourly.sulphur_dioxide || [];

    for (let i = 0; i < times.length; i++) {
      const timeIso = times[i];
      const hPm25 = pm25Arr[i] ?? null;
      const hPm10 = pm10Arr[i] ?? null;

      const hourlyReadings: PollutantReadings = {
        pm25: hPm25,
        pm10: hPm10,
        no2: no2Arr[i] ?? null,
        o3: o3Arr[i] ?? null,
        co: coArr[i] ?? null,
        so2: so2Arr[i] ?? null,
      };

      const hNaqi = calculateNaqi(hourlyReadings);

      hourlyForecast.push({
        timeIso,
        pm25: hPm25,
        pm10: hPm10,
        estimatedNaqi: hNaqi.naqi,
        category: hNaqi.category,
      });
    }
  }

  const snapshot: AirQualitySnapshot = {
    location,
    naqi: naqiResult.naqi,
    dominantPollutant: naqiResult.dominantPollutant || "pm25",
    category: naqiResult.category,
    pollutants: currentPollutants,
    hourlyForecast,
    source,
    stationName,
    fetchedAt: new Date().toISOString(),
    isFallback,
  };

  telemetryCache.set(cacheKey, snapshot);
  return snapshot;
}
