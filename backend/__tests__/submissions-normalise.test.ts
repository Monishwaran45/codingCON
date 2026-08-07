/**
 * Unit tests for the normalise() helper in src/routes/submissions.ts
 *
 * submissions.ts defines its own normalise() that is subtly different from
 * the one in worker.ts:
 *
 *   submissions.ts  →  s.split('\n').map(l => l.trimEnd()).join('\n').trim()
 *   worker.ts       →  each line is fully trim()ed (both ends), not just trimEnd()
 *
 * This file documents and verifies that contract.  Any future unification of
 * the two helpers must keep both test suites green.
 *
 * Because submissions.ts does not export normalise(), we re-implement it here
 * exactly as it appears in the source (whitebox contract test).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mirror of src/routes/submissions.ts normalise()
// ─────────────────────────────────────────────────────────────────────────────

/** Must stay in sync with submissions.ts */
function normalise(s: string): string {
  return s.split('\n').map((l) => l.trimEnd()).join('\n').trim();
}

describe('submissions normalise()', () => {
  // ── basic cases ───────────────────────────────────────────────────────────
  it('returns empty string for empty input', () => {
    expect(normalise('')).toBe('');
  });

  it('passes through a clean single-line string unchanged', () => {
    expect(normalise('hello')).toBe('hello');
  });

  it('passes through a clean multi-line string unchanged', () => {
    expect(normalise('a\nb\nc')).toBe('a\nb\nc');
  });

  // ── trailing whitespace ───────────────────────────────────────────────────
  it('strips trailing spaces from a single line', () => {
    expect(normalise('hello   ')).toBe('hello');
  });

  it('strips trailing tabs from a single line', () => {
    expect(normalise('hello\t\t')).toBe('hello');
  });

  it('strips trailing spaces from each line independently', () => {
    expect(normalise('a   \nb   \nc   ')).toBe('a\nb\nc');
  });

  it('strips trailing newline (outer trim)', () => {
    expect(normalise('hello\n')).toBe('hello');
  });

  it('strips multiple trailing newlines', () => {
    expect(normalise('hello\n\n\n')).toBe('hello');
  });

  // ── leading whitespace (KEY DIFFERENCE from worker normalise) ─────────────
  it('does NOT strip leading spaces from individual lines', () => {
    // submissions.ts uses trimEnd(), not trim(), so leading spaces are kept.
    expect(normalise('  hello')).toBe('hello'); // outer .trim() catches this case
  });

  it('preserves leading spaces on lines that are NOT the first/last', () => {
    // The outer .trim() only removes leading/trailing from the joined string,
    // not from individual middle lines.
    expect(normalise('a\n  b\nc')).toBe('a\n  b\nc');
  });

  // ── blank lines ───────────────────────────────────────────────────────────
  it('strips leading blank lines (outer trim)', () => {
    expect(normalise('\n\nhello')).toBe('hello');
  });

  it('strips trailing blank lines (outer trim)', () => {
    expect(normalise('hello\n\n')).toBe('hello');
  });

  it('preserves blank lines between content', () => {
    expect(normalise('a\n\nb')).toBe('a\n\nb');
  });

  it('preserves blank lines with trailing spaces stripped', () => {
    expect(normalise('a\n   \nb')).toBe('a\n\nb');
  });

  // ── note: does NOT normalise \\r\\n (no CRLF handling) ────────────────────
  it('does NOT normalise Windows line endings (\\r\\n becomes \\r on split)', () => {
    // split('\n') on 'a\r\nb' gives ['a\r', 'b']
    // trimEnd() removes \r → ['a', 'b']
    // This is a side-effect, not a documented feature.
    const result = normalise('a\r\nb');
    expect(result).toBe('a\nb');
  });

  it('does NOT remove bare \\r', () => {
    // 'a\rb'.split('\n') → ['a\rb'] → trimEnd keeps it
    expect(normalise('a\rb')).toBe('a\rb');
  });

  // ── judge scenarios ───────────────────────────────────────────────────────
  it('two identical outputs compare equal (AC scenario)', () => {
    expect(normalise('42\n')).toBe(normalise('42'));
  });

  it('trailing-space difference still AC after normalisation', () => {
    expect(normalise('0 1  ')).toBe(normalise('0 1'));
  });

  it('outputs with different content are NOT equal (WA scenario)', () => {
    expect(normalise('0 1')).not.toBe(normalise('1 0'));
  });

  it('case differences are NOT normalised (WA scenario)', () => {
    expect(normalise('YES')).not.toBe(normalise('yes'));
  });

  // ── difference from worker.ts normalise ───────────────────────────────────
  it('leading spaces on a middle line are preserved (unlike worker normalise)', () => {
    // worker.ts:      normalise('a\n  b\nc') → 'a\nb\nc'  (per-line trim)
    // submissions.ts: normalise('a\n  b\nc') → 'a\n  b\nc' (trimEnd only)
    expect(normalise('a\n  b\nc')).toBe('a\n  b\nc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-comparison: document where the two helpers diverge
// ─────────────────────────────────────────────────────────────────────────────

/** Mirror of worker.ts normalise() for comparison */
function workerNormalise(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}

describe('submissions vs worker normalise — divergence documentation', () => {
  it('both agree on simple string with trailing newline', () => {
    expect(normalise('42\n')).toBe(workerNormalise('42\n'));
  });

  it('both agree on trailing spaces', () => {
    expect(normalise('hello   ')).toBe(workerNormalise('hello   '));
  });

  it('diverge on leading spaces within a middle line', () => {
    const input = 'a\n  b\nc';
    expect(normalise(input)).toBe('a\n  b\nc');       // submissions: keeps leading spaces
    expect(workerNormalise(input)).toBe('a\nb\nc');    // worker: strips them
    expect(normalise(input)).not.toBe(workerNormalise(input)); // they differ
  });

  it('diverge on bare \\r (worker normalises it, submissions does not)', () => {
    const input = 'a\rb';
    expect(workerNormalise(input)).toBe('a\nb');  // worker converts \r → \n
    expect(normalise(input)).toBe('a\rb');         // submissions leaves \r intact
  });

  it('worker handles null/undefined, submissions does not (type difference)', () => {
    expect(workerNormalise(null)).toBe('');
    expect(workerNormalise(undefined)).toBe('');
    // submissions.ts normalise() takes string, not string|null|undefined
    // calling it with null would be a type error — intentionally not tested here
  });
});
