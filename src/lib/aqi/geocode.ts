/**
 * Pan-India Geocoding & Reverse Geocoding Service.
 *
 * Connects to Open-Meteo Geocoding for forward search and OpenStreetMap Nominatim
 * for coordinate reverse resolution, bounded by Indian geography and cached for performance.
 */

import { z } from "zod";
import { ResolvedLocation, ResolvedLocationSchema } from "@/types/air-quality";
import { MemoryCache } from "@/lib/security/cache";
import { sanitizeString } from "@/lib/security/sanitize";

// 1 hour cache for geocoding results
const geocodeCache = new MemoryCache<ResolvedLocation[]>(3600000, 500);
const reverseGeocodeCache = new MemoryCache<ResolvedLocation>(3600000, 500);

// Open-Meteo geocoding response schema
const OpenMeteoResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  admin1: z.string().optional(), // Indian state / UT
  admin2: z.string().optional(), // District
});

const OpenMeteoResponseSchema = z.object({
  results: z.array(OpenMeteoResultSchema).optional(),
});

/**
 * Searches for Indian cities, towns, or districts using Open-Meteo.
 */
export async function searchIndianLocations(
  query: string
): Promise<ResolvedLocation[]> {
  const sanitizedQuery = sanitizeString(query, 100);
  if (!sanitizedQuery || sanitizedQuery.length < 2) {
    return [];
  }

  const cacheKey = `geo_search_${sanitizedQuery.toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    sanitizedQuery
  )}&count=8&language=en&format=json&countryCode=IN`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const parsed = OpenMeteoResponseSchema.safeParse(data);
    if (!parsed.success || !parsed.data.results) {
      return [];
    }

    const resolved: ResolvedLocation[] = [];

    for (const item of parsed.data.results) {
      const locCandidate = {
        name: item.name,
        state: item.admin1 || item.name,
        country: item.country || "India",
        lat: Number(item.latitude.toFixed(4)),
        lon: Number(item.longitude.toFixed(4)),
      };

      const valid = ResolvedLocationSchema.safeParse(locCandidate);
      if (valid.success) {
        resolved.push(valid.data);
      }
    }

    geocodeCache.set(cacheKey, resolved);
    return resolved;
  } catch (err) {
    // Non-blocking fallback: return empty list on network error or timeout
    console.warn(`[searchIndianLocations] Geocoding lookup failed for query "${sanitizedQuery}":`, (err as Error).message);
    return [];
  }
}

/**
 * Validates whether coordinates fall roughly within the geographical bounds of India.
 * India bounding box: Lat 6.0°N to 38.0°N, Lon 68.0°E to 98.0°E
 */
export function isWithinIndiaBounds(lat: number, lon: number): boolean {
  return lat >= 6.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0;
}

// Nominatim reverse geocode response schema
const NominatimResponseSchema = z.object({
  display_name: z.string().optional(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      suburb: z.string().optional(),
      county: z.string().optional(),
      state_district: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

/**
 * Reverse geocodes latitude & longitude coordinates into an Indian location.
 * Validates India bounding box and gracefully falls back to coordinate label if Nominatim is rate-limited.
 */
export async function reverseGeocodeIndia(
  lat: number,
  lon: number
): Promise<ResolvedLocation> {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    throw new Error("Invalid coordinate numbers provided for reverse geocoding.");
  }

  if (!isWithinIndiaBounds(lat, lon)) {
    throw new Error(
      `Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)}) fall outside India geographical boundaries (Lat 6–38°N, Lon 68–98°E).`
    );
  }

  const cacheKey = `rev_geo_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const fallbackLocation: ResolvedLocation = {
    name: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
    state: "India",
    country: "India",
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "VayuPlan-AirAssistant/1.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      reverseGeocodeCache.set(cacheKey, fallbackLocation);
      return fallbackLocation;
    }

    const json = await res.json();
    const parsed = NominatimResponseSchema.safeParse(json);
    if (!parsed.success || !parsed.data.address) {
      reverseGeocodeCache.set(cacheKey, fallbackLocation);
      return fallbackLocation;
    }

    const addr = parsed.data.address;
    const name =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

    const state = addr.state || addr.state_district || "India";
    const country = addr.country || "India";

    const resolved: ResolvedLocation = {
      name,
      state,
      country,
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
    };

    reverseGeocodeCache.set(cacheKey, resolved);
    return resolved;
  } catch (err) {
    // Graceful fallback to coordinate name
    console.warn(`[reverseGeocodeIndia] Reverse lookup failed for (${lat}, ${lon}):`, (err as Error).message);
    reverseGeocodeCache.set(cacheKey, fallbackLocation);
    return fallbackLocation;
  }
}
