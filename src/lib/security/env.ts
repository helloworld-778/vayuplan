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

const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
];

/** Gemini model identifier. Defaults to gemini-4-hydrogen. */
export function getGeminiModel(): string {
  const model = optionalEnv("GEMINI_MODEL").trim();
  return model || "gemini-4-hydrogen";
}

/**
 * Ordered list of fallback Gemini models read from optional comma-separated
 * GEMINI_FALLBACK_MODELS env var, defaulting to
 * ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'].
 */
export function getGeminiFallbackModels(): string[] {
  const raw = optionalEnv("GEMINI_FALLBACK_MODELS").trim();
  if (!raw) {
    return [...DEFAULT_GEMINI_FALLBACK_MODELS];
  }
  const parsed = raw
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  return parsed.length > 0 ? parsed : [...DEFAULT_GEMINI_FALLBACK_MODELS];
}

/**
 * Deduplicated ordered candidate model list: [primaryModel, ...fallbackModels].
 */
export function getGeminiCandidateModels(): string[] {
  const raw = [getGeminiModel(), ...getGeminiFallbackModels()];
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const model of raw) {
    if (model && !seen.has(model)) {
      seen.add(model);
      candidates.push(model);
    }
  }
  return candidates;
}

/** WAQI API token — returns string if configured, or null if unset. */
export function getWaqiApiToken(): string | null {
  const token = optionalEnv("WAQI_API_TOKEN");
  return token.trim() ? token.trim() : null;
}

export function hasWaqiApiToken(): boolean {
  return getWaqiApiToken() !== null;
}
