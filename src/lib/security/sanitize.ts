/**
 * Input sanitization helpers for user search and chat inputs.
 * Strips dangerous control characters, trims whitespace, and limits length.
 */

export function sanitizeString(
  input: unknown,
  maxLength: number = 500
): string {
  if (typeof input !== "string") {
    return "";
  }

  // Filter out non-printable ASCII control characters (0x00 - 0x1F, 0x7F) except newline (10) and tab (9)
  let cleaned = "";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if ((code >= 32 && code !== 127) || code === 9 || code === 10) {
      cleaned += input[i];
    }
  }

  // Trim whitespace and enforce maximum length
  return cleaned.trim().slice(0, maxLength);
}
