import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchLiveAirQuality, TelemetryUnavailableError } from "@/lib/aqi/fetch-air-quality";
import { isWithinIndiaBounds } from "@/lib/aqi/geocode";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { ResolvedLocation } from "@/types/air-quality";

const AirQualityParamsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  name: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`aq_${clientIp}`, 30, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many air quality requests. Please slow down.",
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.retryAfterSeconds.toString(),
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawParams = {
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    name: searchParams.get("name") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    country: searchParams.get("country") ?? undefined,
  };

  const parsed = AirQualityParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Missing or invalid coordinates. 'lat' and 'lon' are required numbers.",
        code: "INVALID_COORDINATES",
      },
      { status: 400 }
    );
  }

  const { lat, lon, name, state, country } = parsed.data;

  if (!isWithinIndiaBounds(lat, lon)) {
    return NextResponse.json(
      {
        error: "Coordinates fall outside Indian boundaries (Lat 6–38°N, Lon 68–98°E).",
        code: "OUT_OF_BOUNDS",
      },
      { status: 400 }
    );
  }

  const location: ResolvedLocation = {
    name: name || `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
    state: state || "India",
    country: country || "India",
    lat,
    lon,
  };

  try {
    const snapshot = await fetchLiveAirQuality(location);
    return NextResponse.json(snapshot);
  } catch (err) {
    if (err instanceof TelemetryUnavailableError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "TELEMETRY_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to retrieve atmospheric telemetry. Please try again.",
        code: "TELEMETRY_ERROR",
      },
      { status: 502 }
    );
  }
}
