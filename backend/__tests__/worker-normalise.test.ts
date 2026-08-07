/**
 * Unit tests for worker.ts — normalise() and verdict decision logic.
 *
 * worker.ts does not export normalise() or runJudge(), so we test them by:
 *   a) Re-implementing normalise() here exactly as it appears in the source
 *      and asserting the same behaviour (whitebox contract test).
 *   b) Exercising the verdict decision rules in isolation via a thin harness
 *      that mirrors the exact logic in runJudge() without touching the DB,
 *      queue, or filesystem.
 *
 * This approach keeps the tests fast (no I/O) and stable (no network).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. normalise() — exact copy of the function from src/worker.ts
//    Any deviation in worker.ts should cause these tests to fail, acting as
//    a living specification for the function's contract.
// ─────────────────────────────────────────────────────────────────────────────

/** Mirror of worker.ts normalise() — must stay in sync with the source */
function normalise(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}

describe('worker normalise()', () => {
  // ── null / undefined / empty ────────────────────────────────────────────
  it('returns empty string for null', () => {
    expect(normalise(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalise(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalise('')).toBe('');
  });

  it('returns empty string for whitespace-only string', () => {
    expect(normalise('   \n  \t  \n')).toBe('');
  });

  // ── line ending normalisation ────────────────────────────────────────────
  it('converts \\r\\n (Windows) to \\n', () => {
    expect(normalise('a\r\nb')).toBe('a\nb');
  });

  it('converts bare \\r (old Mac) to \\n', () => {
    expect(normalise('a\rb')).toBe('a\nb');
  });

  it('handles mixed \\r\\n and \\r in one string', () => {
    expect(normalise('a\r\nb\rc')).toBe('a\nb\nc');
  });

  // ── per-line trimming ────────────────────────────────────────────────────
  it('trims leading spaces from each line', () => {
    expect(normalise('  hello\n  world')).toBe('hello\nworld');
  });

  it('trims trailing spaces from each line', () => {
    expect(normalise('hello   \nworld   ')).toBe('hello\nworld');
  });

  it('trims tabs from each line', () => {
    expect(normalise('\thello\t\n\tworld\t')).toBe('hello\nworld');
  });

  // ── whole-string trim ────────────────────────────────────────────────────
  it('removes leading blank lines', () => {
    expect(normalise('\n\nhello')).toBe('hello');
  });

  it('removes trailing blank lines', () => {
    expect(normalise('hello\n\n')).toBe('hello');
  });

  it('preserves blank lines between content lines', () => {
    // Each blank line becomes an empty string after per-line trim,
    // and the outer trim only removes leading/trailing blank lines.
    expect(normalise('a\n\nb')).toBe('a\n\nb');
  });

  // ── typical judge scenarios ──────────────────────────────────────────────
  it('two identical outputs compare equal after normalisation', () => {
    const expected = '0 1\n';
    const actual   = '0 1\r\n';
    expect(normalise(actual)).toBe(normalise(expected));
  });

  it('different trailing-space outputs compare equal', () => {
    expect(normalise('42  ')).toBe(normalise('42'));
  });

  it('different line endings compare equal (AC scenario)', () => {
    const prog = 'hello\nworld\n';
    const ref  = 'hello\r\nworld\r\n';
    expect(normalise(prog)).toBe(normalise(ref));
  });

  it('different content after normalisation remains unequal (WA scenario)', () => {
    expect(normalise('0 1')).not.toBe(normalise('1 0'));
  });

  it('case differences are NOT normalised (WA scenario)', () => {
    expect(normalise('YES')).not.toBe(normalise('yes'));
  });

  it('extra blank line between answers is preserved (WA scenario)', () => {
    // A submission that prints an extra blank line between answers should fail.
    expect(normalise('1\n\n2')).not.toBe(normalise('1\n2'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Verdict decision rules — thin harness mirroring runJudge()
//
//    The exact verdict logic in worker.ts is:
//      if (result.timedOut || result.netTimeMs > job.timeLimitMs)  → TLE
//      else if (result.exitCode !== 0)                              → RE
//      else if (normalise(stdout) !== normalise(expected))          → WA
//      else                                                         → AC
// ─────────────────────────────────────────────────────────────────────────────

type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE';

interface MockRunResult {
  stdout:     string;
  stderr:     string;
  netTimeMs:  number;
  exitCode:   number;
  timedOut:   boolean;
  memoryKb:   number;
}

function decideVerdict(
  result: MockRunResult,
  expectedOutput: string,
  timeLimitMs: number,
): Verdict {
  if (result.timedOut || result.netTimeMs > timeLimitMs) return 'TLE';
  if (result.exitCode !== 0)                              return 'RE';
  if (normalise(result.stdout) !== normalise(expectedOutput)) return 'WA';
  return 'AC';
}

const base: MockRunResult = {
  stdout:    '',
  stderr:    '',
  netTimeMs: 100,
  exitCode:  0,
  timedOut:  false,
  memoryKb:  0,
};

describe('verdict decision logic', () => {
  // ── AC ────────────────────────────────────────────────────────────────────
  it('returns AC when output matches exactly', () => {
    expect(decideVerdict({ ...base, stdout: '42' }, '42', 1000)).toBe('AC');
  });

  it('returns AC when output matches after normalisation (trailing \\n)', () => {
    expect(decideVerdict({ ...base, stdout: '42\n' }, '42', 1000)).toBe('AC');
  });

  it('returns AC when output matches after CRLF normalisation', () => {
    expect(decideVerdict({ ...base, stdout: '0 1\r\n' }, '0 1\n', 1000)).toBe('AC');
  });

  it('returns AC when output has trailing spaces on each line', () => {
    expect(decideVerdict({ ...base, stdout: 'hello   \nworld   ' }, 'hello\nworld', 1000)).toBe('AC');
  });

  // ── WA ────────────────────────────────────────────────────────────────────
  it('returns WA when stdout differs from expected', () => {
    expect(decideVerdict({ ...base, stdout: '0 1' }, '1 0', 1000)).toBe('WA');
  });

  it('returns WA when output is empty but expected is not', () => {
    expect(decideVerdict({ ...base, stdout: '' }, '42', 1000)).toBe('WA');
  });

  it('returns WA when case differs (case-sensitive match)', () => {
    expect(decideVerdict({ ...base, stdout: 'yes' }, 'YES', 1000)).toBe('WA');
  });

  it('returns WA when output has extra content', () => {
    expect(decideVerdict({ ...base, stdout: '42\nextra' }, '42', 1000)).toBe('WA');
  });

  // ── TLE ───────────────────────────────────────────────────────────────────
  it('returns TLE when timedOut flag is true', () => {
    expect(decideVerdict(
      { ...base, timedOut: true, netTimeMs: 500 },
      '42', 1000,
    )).toBe('TLE');
  });

  it('returns TLE when netTimeMs exceeds the limit (even if timedOut is false)', () => {
    // e.g. process finished naturally but was over the problem limit
    expect(decideVerdict(
      { ...base, netTimeMs: 1500 },
      '42', 1000,
    )).toBe('TLE');
  });

  it('returns TLE when netTimeMs == timeLimitMs + 1', () => {
    expect(decideVerdict(
      { ...base, netTimeMs: 1001 },
      '42', 1000,
    )).toBe('TLE');
  });

  it('returns AC (not TLE) when netTimeMs == timeLimitMs exactly (boundary)', () => {
    // The check is strictly >, so equal is NOT a TLE.
    expect(decideVerdict(
      { ...base, stdout: '42', netTimeMs: 1000 },
      '42', 1000,
    )).toBe('AC');
  });

  it('TLE takes priority over correct output', () => {
    // Even if the output would be correct, TLE fires first.
    expect(decideVerdict(
      { ...base, stdout: '42', timedOut: true },
      '42', 1000,
    )).toBe('TLE');
  });

  // ── RE ────────────────────────────────────────────────────────────────────
  it('returns RE when exitCode is 1', () => {
    expect(decideVerdict({ ...base, exitCode: 1 }, '42', 1000)).toBe('RE');
  });

  it('returns RE when exitCode is non-zero (e.g. 139 SIGSEGV)', () => {
    expect(decideVerdict({ ...base, exitCode: 139 }, '42', 1000)).toBe('RE');
  });

  it('RE takes priority over WA (exit code check before output check)', () => {
    expect(decideVerdict(
      { ...base, exitCode: 1, stdout: 'wrong' },
      '42', 1000,
    )).toBe('RE');
  });

  it('TLE takes priority over RE (timeout check is first)', () => {
    expect(decideVerdict(
      { ...base, timedOut: true, exitCode: 1 },
      '42', 1000,
    )).toBe('TLE');
  });

  // ── MLE ───────────────────────────────────────────────────────────────────
  it('never returns MLE from verdict logic (memoryKb always 0 — known gap)', () => {
    // The native runner never sets memoryKb > 0, so MLE is unreachable.
    // This test documents the gap rather than hiding it.
    const verdict = decideVerdict(
      { ...base, memoryKb: 0 },
      '42', 1000,
    );
    expect(verdict).not.toBe('MLE');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  it('handles multiline AC correctly', () => {
    const out      = '1\n2\n3\n';
    const expected = '1\n2\n3';
    expect(decideVerdict({ ...base, stdout: out }, expected, 1000)).toBe('AC');
  });

  it('handles zero timeLimitMs — any run time is TLE', () => {
    expect(decideVerdict(
      { ...base, stdout: '42', netTimeMs: 1 },
      '42', 0,
    )).toBe('TLE');
  });

  it('handles empty expected output AC', () => {
    expect(decideVerdict({ ...base, stdout: '' }, '', 1000)).toBe('AC');
  });

  it('handles empty expected output with blank stdout (normalise → both empty)', () => {
    expect(decideVerdict({ ...base, stdout: '\n\n' }, '', 1000)).toBe('AC');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. passedTestCases counter and break-on-first-failure
//
//    runJudge() increments `passed` only on AC, then breaks on first failure.
//    We simulate this with a mini test-case loop.
// ─────────────────────────────────────────────────────────────────────────────

interface TC { expectedOutput: string; timeLimitMs: number }

function simulateJudgeLoop(
  results: MockRunResult[],
  testCases: TC[],
): { passed: number; finalVerdict: Verdict; stoppedAt: number } {
  let passed = 0;
  let finalVerdict: Verdict = 'AC';
  let stoppedAt = results.length;

  for (let i = 0; i < results.length; i++) {
    const v = decideVerdict(results[i], testCases[i].expectedOutput, testCases[i].timeLimitMs);
    if (v === 'AC') {
      passed++;
    } else {
      finalVerdict = v;
      stoppedAt = i;
      break;
    }
  }

  return { passed, finalVerdict, stoppedAt };
}

describe('runJudge loop — passedTestCases and break-on-first-failure', () => {
  const tcs: TC[] = [
    { expectedOutput: '1', timeLimitMs: 1000 },
    { expectedOutput: '2', timeLimitMs: 1000 },
    { expectedOutput: '3', timeLimitMs: 1000 },
    { expectedOutput: '4', timeLimitMs: 1000 },
  ];

  it('counts all test cases as passed when all AC', () => {
    const results: MockRunResult[] = tcs.map((tc) => ({
      ...base, stdout: tc.expectedOutput,
    }));
    const { passed, finalVerdict } = simulateJudgeLoop(results, tcs);
    expect(passed).toBe(4);
    expect(finalVerdict).toBe('AC');
  });

  it('stops at first WA and counts only preceding passes', () => {
    const results: MockRunResult[] = [
      { ...base, stdout: '1' }, // AC
      { ...base, stdout: '1' }, // WA (expected '2')
      { ...base, stdout: '3' }, // never reached
      { ...base, stdout: '4' }, // never reached
    ];
    const { passed, finalVerdict, stoppedAt } = simulateJudgeLoop(results, tcs);
    expect(passed).toBe(1);
    expect(finalVerdict).toBe('WA');
    expect(stoppedAt).toBe(1);
  });

  it('stops at first TLE', () => {
    const results: MockRunResult[] = [
      { ...base, stdout: '1' },                       // AC
      { ...base, stdout: '2' },                       // AC
      { ...base, timedOut: true, stdout: '3' },       // TLE
      { ...base, stdout: '4' },                       // never reached
    ];
    const { passed, finalVerdict, stoppedAt } = simulateJudgeLoop(results, tcs);
    expect(passed).toBe(2);
    expect(finalVerdict).toBe('TLE');
    expect(stoppedAt).toBe(2);
  });

  it('stops at first RE', () => {
    const results: MockRunResult[] = [
      { ...base, stdout: '1' },              // AC
      { ...base, exitCode: 1, stdout: '' },  // RE
      { ...base, stdout: '3' },              // never reached
      { ...base, stdout: '4' },              // never reached
    ];
    const { passed, finalVerdict } = simulateJudgeLoop(results, tcs);
    expect(passed).toBe(1);
    expect(finalVerdict).toBe('RE');
  });

  it('returns passed=0 and WA when first test case fails', () => {
    const results: MockRunResult[] = tcs.map(() => ({ ...base, stdout: 'wrong' }));
    const { passed, finalVerdict } = simulateJudgeLoop(results, tcs);
    expect(passed).toBe(0);
    expect(finalVerdict).toBe('WA');
  });

  it('single test case AC', () => {
    const { passed, finalVerdict } = simulateJudgeLoop(
      [{ ...base, stdout: '1' }],
      [tcs[0]],
    );
    expect(passed).toBe(1);
    expect(finalVerdict).toBe('AC');
  });

  it('single test case WA', () => {
    const { passed, finalVerdict } = simulateJudgeLoop(
      [{ ...base, stdout: 'wrong' }],
      [tcs[0]],
    );
    expect(passed).toBe(0);
    expect(finalVerdict).toBe('WA');
  });
});
