/**
 * Canonical output normalisation used by both the judge worker and the
 * submissions route for consistent verdict comparison.
 *
 * Rules:
 *  - null/undefined → empty string
 *  - \r\n and bare \r → \n  (Windows & old-Mac line endings)
 *  - each line is fully trimmed (leading + trailing whitespace)
 *  - the final joined string is trimmed (removes leading/trailing blank lines)
 */
export function normaliseOutput(s: string | null | undefined): string {
  if (!s) return '';
  const cleaned = s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();

  // If the normalized output is a single boolean token (e.g. "True"/"true" or "False"/"false"),
  // normalize to lowercase so Python (True), Java (true), C++, and JS match consistently.
  const lower = cleaned.toLowerCase();
  if (lower === 'true' || lower === 'false' || lower === 'yes' || lower === 'no') {
    return lower;
  }

  return cleaned;
}
