/**
 * node:sqlite returns `Record<string, SQLOutputValue>` from .get() / .all().
 * These helpers cast the result through `unknown` so we can narrow to our
 * specific row types without TypeScript complaining.
 */

type AnyRow = Record<string, unknown>;

/** Cast a single row result */
export function row<T>(v: AnyRow | undefined): T | undefined {
  return v as unknown as T | undefined;
}

/** Cast an array of rows */
export function rows<T>(v: AnyRow[]): T[] {
  return v as unknown as T[];
}
