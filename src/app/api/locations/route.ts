import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reverseGeocodeIndia, searchIndianLocations } from "@/lib/aqi/geocode";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const SearchQuerySchema = z.object({
  q: z.string().min(2).max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`loc_${clientIp}`, 40, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many location requests. Please wait a moment.",
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
    q: searchParams.get("q") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lon: searchParams.get("lon") ?? undefined,
  };

  const parsed = SearchQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters. Provide 'q' (min 2 chars) or valid 'lat' and 'lon'.",
        code: "BAD_REQUEST",
      },
      { status: 400 }
    );
  }

  const { q, lat, lon } = parsed.data;

  try {
    // Reverse geocoding path
    if (lat !== undefined && lon !== undefined) {
      const resolved = await reverseGeocodeIndia(lat, lon);
      return NextResponse.json({ location: resolved });
    }

    // Forward search path
    if (q) {
      const results = await searchIndianLocations(q);
      return NextResponse.json({ results });
    }

    return NextResponse.json(
      {
        error: "Provide either a search query 'q' or both 'lat' and 'lon' coordinates.",
        code: "MISSING_PARAMETERS",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: (err as Error).message || "Geocoding service encountered an error.",
        code: "GEOCODE_ERROR",
      },
      { status: 502 }
    );
  }
}
