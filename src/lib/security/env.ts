/**
 * Server-side environment variable access.
 *
 * This module MUST only be imported in server components, server actions,
 * route handlers, or middleware.
 *
 * None of these variables use the NEXT_PUBLIC_ prefix, so Next.js will
 * never bundle them into client JavaScript.
 */

function optionalEnv(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

/** Gemini API key — returns string if configured, or null if unset. */
export function getGeminiApiKey(): string | null {
  const key = optionalEnv("GEMINI_API_KEY");
  return key.trim() ? key.trim() : null;
}

export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey() !== null;
}

/** Gemini model identifier. Defaults to gemini-2.5-flash. */
export function getGeminiModel(): string {
  return optionalEnv("GEMINI_MODEL", "gemini-2.5-flash");
}

/** WAQI API token — returns string if configured, or null if unset. */
export function getWaqiApiToken(): string | null {
  const token = optionalEnv("WAQI_API_TOKEN");
  return token.trim() ? token.trim() : null;
}

export function hasWaqiApiToken(): boolean {
  return getWaqiApiToken() !== null;
}
