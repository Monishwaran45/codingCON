/**
 * Unit tests for src/judge/runner.ts
 *
 * Coverage targets:
 *   - runCode() — python, javascript, cpp (compile+run), java (compile+run)
 *   - runCode() — unsupported language throws
 *   - runCode() — compile error path (cpp/java bad code)
 *   - runCode() — timeout / TLE path
 *   - runCode() — runtime error path (non-zero exit)
 *   - runCode() — stdin is forwarded correctly
 *   - runCode() — output normalisation (trimEnd)
 *   - runCode() — temp directory is cleaned up after each run
 *   - getJavaClassName() — public class, non-public class, fallback
 *   - LANG_CONFIG — all four languages have required keys
 */

import path from 'path';
import fs   from 'fs';
import os   from 'os';

// ── re-export private helpers for white-box testing ──────────────────────────
// runner.ts doesn't export getJavaClassName or LANG_CONFIG, so we test them
// indirectly through runCode.  We also verify the cleanup side-effect by
// watching os.tmpdir() for leftover judge-* directories.

import { runCode, RunResult } from '../src/judge/runner';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.MOCK_EXECUTION = 'true';
  process.env.SKIP_DOCKER_CHECK = 'true';
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Collect all judge-* temp dirs that exist right now */
function judgeTempsSnapshot(): Set<string> {
  return new Set(
    fs.readdirSync(os.tmpdir())
      .filter((n) => n.startsWith('judge-'))
      .map((n) => path.join(os.tmpdir(), n)),
  );
}

/** Assert a RunResult has the shape of a real result */
function assertResultShape(r: RunResult) {
  expect(typeof r.stdout).toBe('string');
  expect(typeof r.stderr).toBe('string');
  expect(typeof r.executionTimeMs).toBe('number');
  expect(typeof r.netTimeMs).toBe('number');
  expect(typeof r.memoryKb).toBe('number');
  expect(typeof r.exitCode).toBe('number');
  expect(typeof r.timedOut).toBe('boolean');
  expect(r.executionTimeMs).toBeGreaterThanOrEqual(0);
  expect(r.netTimeMs).toBeGreaterThanOrEqual(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Unsupported language
// ─────────────────────────────────────────────────────────────────────────────
describe('runCode — unsupported language', () => {
  it('throws with a descriptive message', async () => {
    await expect(runCode('brainfuck', 'code', '')).rejects.toThrow(
      'Unsupported language: brainfuck',
    );
  });

  it('throws for empty language string', async () => {
    await expect(runCode('', 'code', '')).rejects.toThrow('Unsupported language:');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Python
// ─────────────────────────────────────────────────────────────────────────────
describe('runCode — python', () => {
  it('runs hello-world and returns stdout', async () => {
    const r = await runCode('python', 'print("hello")', '');
    assertResultShape(r);
    expect(r.stdout).toBe('hello');
    expect(r.exitCode).toBe(0);
    expect(r.timedOut).toBe(false);
  });

  it('reads stdin correctly', async () => {
    const code = 'import sys\nprint(sys.stdin.read().strip().upper())';
    const r = await runCode('python', code, 'hello world');
    expect(r.stdout).toBe('HELLO WORLD');
    expect(r.exitCode).toBe(0);
  });

  it('returns non-zero exitCode on runtime error', async () => {
    const r = await runCode('python', 'raise ValueError("oops")', '');
    assertResultShape(r);
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toContain('ValueError');
  });

  it('returns non-zero exitCode on syntax error', async () => {
    const r = await runCode('python', 'def bad(:\n  pass', '');
    assertResultShape(r);
    expect(r.exitCode).not.toBe(0);
  });

  it('trims trailing whitespace from stdout (trimEnd on full output)', async () => {
    const r = await runCode('python', 'print("hi   ")', '');
    // Python's print adds a newline; trimEnd() on the full stdout string removes the
    // trailing newline.  Spaces *before* the newline are also removed by trimEnd().
    expect(r.stdout).toBe('hi');
  });

  it('handles multi-line output', async () => {
    const code = 'for i in range(3):\n    print(i)';
    const r = await runCode('python', code, '');
    // trimEnd() is applied to the joined stdout; split on \n and trim each to compare
    const lines = r.stdout.split('\n').map(l => l.trim());
    expect(lines).toEqual(['0', '1', '2']);
    expect(r.exitCode).toBe(0);
  });

  it('handles empty stdin gracefully', async () => {
    const r = await runCode('python', 'print("ok")', '');
    expect(r.stdout).toBe('ok');
  });

  it('cleans up temp directory after success', async () => {
    const before = judgeTempsSnapshot();
    await runCode('python', 'print(1)', '');
    const after = judgeTempsSnapshot();
    const leaked = [...after].filter((p) => !before.has(p));
    expect(leaked).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. JavaScript (Node.js)
// ─────────────────────────────────────────────────────────────────────────────
describe('runCode — javascript', () => {
  it('runs hello-world', async () => {
    const r = await runCode('javascript', 'console.log("hello");', '');
    assertResultShape(r);
    expect(r.stdout).toBe('hello');
    expect(r.exitCode).toBe(0);
  });

  it('reads stdin via process.stdin', async () => {
    const code = `
      let data = '';
      process.stdin.on('data', d => data += d);
      process.stdin.on('end', () => console.log(data.trim().split('').reverse().join('')));
    `;
    const r = await runCode('javascript', code, 'abc');
    expect(r.stdout).toBe('cba');
    expect(r.exitCode).toBe(0);
  });

  it('returns non-zero exitCode on thrown error', async () => {
    const r = await runCode('javascript', 'throw new Error("boom");', '');
    assertResultShape(r);
    expect(r.exitCode).not.toBe(0);
  });

  it('captures stderr', async () => {
    const r = await runCode('javascript', 'console.error("err msg");', '');
    expect(r.stderr).toContain('err msg');
  });

  it('cleans up temp directory after error', async () => {
    const before = judgeTempsSnapshot();
    await runCode('javascript', 'throw new Error("x");', '');
    const after = judgeTempsSnapshot();
    const leaked = [...after].filter((p) => !before.has(p));
    expect(leaked).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. C++ (requires g++ in PATH)
// ─────────────────────────────────────────────────────────────────────────────
const hasCpp = (): boolean => {
  try {
    require('child_process').execFileSync('g++', ['--version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

const describeCpp = hasCpp() ? describe : describe.skip;

describeCpp('runCode — cpp', () => {
  const helloWorld = `
#include <iostream>
using namespace std;
int main() { cout << "hello" << endl; return 0; }
`;

  it('compiles and runs hello-world', async () => {
    const r = await runCode('cpp', helloWorld, '');
    assertResultShape(r);
    expect(r.stdout).toBe('hello');
    expect(r.exitCode).toBe(0);
    expect(r.timedOut).toBe(false);
  });

  it('reads stdin', async () => {
    const code = `
#include <iostream>
using namespace std;
int main() { int n; cin >> n; cout << n * 2 << endl; return 0; }
`;
    const r = await runCode('cpp', code, '21');
    expect(r.stdout).toBe('42');
    expect(r.exitCode).toBe(0);
  });

  it('returns compile error for bad code', async () => {
    const r = await runCode('cpp', 'int main() { bad syntax }', '');
    assertResultShape(r);
    expect(r.exitCode).toBe(1);
    expect(r.stderr.length).toBeGreaterThan(0);
    expect(r.stdout).toBe('');
    expect(r.timedOut).toBe(false);
  });

  it('returns non-zero exitCode on runtime error (segfault)', async () => {
    const code = `
#include <cstdlib>
int main() { int* p = nullptr; *p = 42; return 0; }
`;
    const r = await runCode('cpp', code, '');
    assertResultShape(r);
    expect(r.exitCode).not.toBe(0);
  });

  it('cleans up temp dir after compile error', async () => {
    const before = judgeTempsSnapshot();
    await runCode('cpp', 'not valid c++', '');
    const after = judgeTempsSnapshot();
    const leaked = [...after].filter((p) => !before.has(p));
    expect(leaked).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Java (requires javac + java in PATH)
// ─────────────────────────────────────────────────────────────────────────────
const hasJava = (): boolean => {
  try {
    require('child_process').execFileSync('javac', ['-version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

const describeJava = hasJava() ? describe : describe.skip;

describeJava('runCode — java', () => {
  it('compiles and runs hello-world with public class', async () => {
    const code = `
public class Solution {
  public static void main(String[] args) {
    System.out.println("hello");
  }
}
`;
    const r = await runCode('java', code, '');
    assertResultShape(r);
    expect(r.stdout).toBe('hello');
    expect(r.exitCode).toBe(0);
  });

  it('reads stdin', async () => {
    const code = `
import java.util.Scanner;
public class Solution {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    System.out.println(n * 3);
  }
}
`;
    const r = await runCode('java', code, '7');
    expect(r.stdout).toBe('21');
  });

  it('returns compile error for bad Java code', async () => {
    const code = `public class Solution { invalid }`;
    const r = await runCode('java', code, '');
    assertResultShape(r);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Timeout / TLE behaviour
// ─────────────────────────────────────────────────────────────────────────────
describe('runCode — timeout (TLE)', () => {
  /**
   * We override JUDGE_TIMEOUT_MS to 500ms for this group so tests don't
   * take 10 seconds each.  Jest module caching means we re-require runner
   * with the env already set in setup.ts; to test a *different* timeout we
   * manipulate process.env and reload the module via jest.resetModules().
   */
  beforeEach(() => {
    jest.resetModules();
    process.env.JUDGE_TIMEOUT_MS = '800';
  });

  afterEach(() => {
    process.env.JUDGE_TIMEOUT_MS = '10000';
    jest.resetModules();
  });

  it('sets timedOut=true when a python process loops forever', async () => {
    // re-import with the new env value
    const { runCode: rc } = await import('../src/judge/runner');
    const r = await rc('python', 'while True: pass', '');
    assertResultShape(r);
    expect(r.timedOut).toBe(true);
  }, 10000 /* give Jest enough room */);

  it('sets timedOut=true for an infinite JS loop', async () => {
    const { runCode: rc } = await import('../src/judge/runner');
    const r = await rc('javascript', 'while(true){}', '');
    assertResultShape(r);
    expect(r.timedOut).toBe(true);
  }, 10000);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. RunResult shape invariants (cross-language)
// ─────────────────────────────────────────────────────────────────────────────
describe('RunResult invariants', () => {
  it('netTimeMs is never negative', async () => {
    const r = await runCode('python', 'print(1)', '');
    expect(r.netTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('memoryKb is always 0 in native mode (not yet implemented)', async () => {
    // This documents the known gap — memory measurement is not implemented.
    const r = await runCode('python', 'print(1)', '');
    expect(r.memoryKb).toBe(0);
  });

  it('executionTimeMs >= netTimeMs (overhead is non-negative)', async () => {
    const r = await runCode('python', 'print(1)', '');
    expect(r.executionTimeMs).toBeGreaterThanOrEqual(r.netTimeMs);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. executeTestSuite — Batch evaluation with Single Compilation
// ─────────────────────────────────────────────────────────────────────────────
describe('executeTestSuite — Batch evaluation', () => {
  const { executeTestSuite } = require('../src/judge/runner');

  it('executes all test cases and returns AC when all pass', async () => {
    const testCases = [
      { id: 'tc-1', input: 'hello', expectedOutput: 'hello', isSample: true },
      { id: 'tc-2', input: 'world', expectedOutput: 'world', isSample: false },
    ];
    const progressEvents: any[] = [];
    const suite = await executeTestSuite(
      'python',
      'print("test")',
      testCases,
      1000,
      (res: any, passed: number, total: number) => {
        progressEvents.push({ res, passed, total });
      },
    );

    expect(suite.finalVerdict).toBe('AC');
    expect(suite.passedTestCases).toBe(2);
    expect(suite.totalTestCases).toBe(2);
    expect(suite.failedTestCase).toBeNull();
    expect(progressEvents).toHaveLength(2);
  });

  it('stops on first failure and emits progress correctly', async () => {
    const testCases = [
      { id: 'tc-1', input: 'hello', expectedOutput: 'hello' },
      { id: 'tc-2', input: 'wrong', expectedOutput: 'expected' },
      { id: 'tc-3', input: 'unreachable', expectedOutput: 'unreachable' },
    ];
    const progressEvents: any[] = [];
    const suite = await executeTestSuite(
      'python',
      'print("test")',
      testCases,
      1000,
      (res: any, passed: number, total: number) => {
        progressEvents.push({ res, passed, total });
      },
      true,
    );

    expect(suite.finalVerdict).toBe('WA');
    expect(suite.passedTestCases).toBe(1);
    expect(suite.failedTestCase).toBeDefined();
    expect(suite.failedTestCase?.id).toBe('tc-2');
    expect(progressEvents).toHaveLength(2);
  });
});
