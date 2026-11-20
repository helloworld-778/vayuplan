/**
 * Server-side environment variable access.
 *
 * This module MUST only be imported in server components, server actions,
 * route handlers, or middleware. Importing it in a client component will
 * cause a build-time error because `server-only` is listed as a dependency.
 *
 * None of these variables use the NEXT_PUBLIC_ prefix, so Next.js will
 * never bundle them into client JavaScript.
 */

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.example to .env.local and fill in all values.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/** Gemini API key — required at runtime for AI features. */
export function getGeminiApiKey(): string {
  return requiredEnv("GEMINI_API_KEY");
}

/** Gemini model identifier. Defaults to gemini-2.5-flash. */
export function getGeminiModel(): string {
  return optionalEnv("GEMINI_MODEL", "gemini-2.5-flash");
}

/** WAQI API token — required at runtime for air quality data. */
export function getWaqiApiToken(): string {
  return requiredEnv("WAQI_API_TOKEN");
}
