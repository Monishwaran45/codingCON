/**
 * Code execution engine.
 *
 * Two modes (controlled by JUDGE_USE_DOCKER env var):
 *   JUDGE_USE_DOCKER=true  — runs code inside an isolated Docker container
 *   JUDGE_USE_DOCKER=false — runs code as a native child process (dev/no-Docker)
 *
 * Both modes return a normalised RunResult.
 */

import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface RunResult {
  stdout:          string;
  stderr:          string;
  executionTimeMs: number;   // wall-clock time (stored in DB, shown to user)
  netTimeMs:       number;   // wall-clock minus spawn overhead (used for TLE check)
  memoryKb:        number;
  exitCode:        number;
  timedOut:        boolean;
}

const TIMEOUT_MS  = Number(process.env.JUDGE_TIMEOUT_MS  ?? 10000);
const MEMORY_MB   = Number(process.env.JUDGE_MEMORY_MB   ?? 256);
const USE_DOCKER  = process.env.JUDGE_USE_DOCKER === 'true';

// On Windows, native process spawn adds ~400-700ms overhead per invocation.
// In Docker mode this overhead doesn't apply (container is pre-warmed).
// We subtract this from the measured time before comparing to the problem limit.
const SPAWN_OVERHEAD_MS = (process.platform === 'win32' && !USE_DOCKER) ? 600 : 0;

// ── Language metadata ─────────────────────────────────────────────────────────
const LANG_CONFIG: Record<string, {
  ext: string;
  image: string;
  buildCmd?: (src: string, out: string) => string[];
  runCmd:    (src: string, out: string) => string[];
}> = {
  python: {
    ext:    'py',
    image:  'python:3.11-alpine',
    runCmd: (src) => ['python3', src],
  },
  javascript: {
    ext:    'js',
    image:  'node:20-alpine',
    runCmd: (src) => ['node', src],
  },
  cpp: {
    ext:    'cpp',
    image:  'gcc:13',
    buildCmd: (src, out) => ['g++', '-O2', '-std=c++17', '-o', out, src],
    runCmd:   (_src, out) => [out],
  },
  java: {
    ext:    'java',
    image:  'openjdk:21-slim',
    buildCmd: (src) => ['javac', src],
    runCmd:   (src) => ['java', '-cp', path.dirname(src), 'Solution'],
  },
};

// ── Public API ────────────────────────────────────────────────────────────────
export async function runCode(
  language: string,
  code: string,
  stdin: string,
): Promise<RunResult> {
  const cfg = LANG_CONFIG[language];
  if (!cfg) throw new Error(`Unsupported language: ${language}`);

  if (USE_DOCKER) return runInDocker(language, code, stdin, cfg);
  return runNative(language, code, stdin, cfg);
}

// ── Native runner (dev mode, no Docker) ──────────────────────────────────────
async function runNative(
  language: string,
  code: string,
  stdin: string,
  cfg: typeof LANG_CONFIG[string],
): Promise<RunResult> {
  const dir    = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));
  const srcFile = path.join(dir, language === 'java' ? 'Solution.' + cfg.ext : 'solution.' + cfg.ext);
  const binFile = path.join(dir, 'solution');

  fs.writeFileSync(srcFile, code, 'utf8');

  // Compile if needed
  if (cfg.buildCmd) {
    try {
      await execFileAsync(cfg.buildCmd(srcFile, binFile)[0], cfg.buildCmd(srcFile, binFile).slice(1), {
        timeout: TIMEOUT_MS,
        cwd: dir,
      });
    } catch (err: unknown) {
      cleanup(dir);
      const e = err as { stderr?: string; message?: string };
      return {
        stdout: '', stderr: e.stderr ?? e.message ?? 'Compilation error',
        executionTimeMs: 0, netTimeMs: 0, memoryKb: 0, exitCode: 1, timedOut: false,
      };
    }
  }

  const runArgs = cfg.runCmd(srcFile, binFile);
  const start   = Date.now();

  return new Promise((resolve) => {
    const child = spawn(runArgs[0], runArgs.slice(1), {
      cwd: dir,
      env: { ...process.env, PATH: process.env.PATH },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);

    child.stdin.write(stdin ?? '');
    child.stdin.end();

    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      cleanup(dir);
      const wall = Date.now() - start;
      resolve({
        stdout:          stdout.trimEnd(),
        stderr:          stderr.trimEnd(),
        executionTimeMs: wall,
        netTimeMs:       Math.max(0, wall - SPAWN_OVERHEAD_MS),
        memoryKb:        0,
        exitCode:        code ?? 1,
        timedOut,
      });
    });
  });
}

// ── Docker runner (production) ────────────────────────────────────────────────
async function runInDocker(
  language: string,
  code: string,
  stdin: string,
  cfg: typeof LANG_CONFIG[string],
): Promise<RunResult> {
  const dir     = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));
  const srcName = language === 'java' ? `Solution.${cfg.ext}` : `solution.${cfg.ext}`;
  const srcFile = path.join(dir, srcName);
  fs.writeFileSync(srcFile, code, 'utf8');
  fs.writeFileSync(path.join(dir, 'stdin.txt'), stdin ?? '', 'utf8');

  // Build the docker run command
  const compileStep = cfg.buildCmd
    ? `${cfg.buildCmd(`/code/${srcName}`, '/code/solution').join(' ')} && `
    : '';
  const runStep = cfg.runCmd(`/code/${srcName}`, '/code/solution').join(' ');
  const shellCmd = `${compileStep}${runStep} < /code/stdin.txt`;

  const args = [
    'run', '--rm',
    '--network', 'none',
    '--memory', `${MEMORY_MB}m`,
    '--memory-swap', `${MEMORY_MB}m`,
    '--cpus', '0.5',
    '--ulimit', 'nproc=64',
    '--ulimit', 'nofile=64',
    '-v', `${dir}:/code:ro`,
    cfg.image,
    'sh', '-c', shellCmd,
  ];

  const start = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync('docker', args, {
      timeout: TIMEOUT_MS + 2000,
      maxBuffer: 10 * 1024 * 1024,
    });
    cleanup(dir);
    const wall = Date.now() - start;
    return {
      stdout:          stdout.trimEnd(),
      stderr:          stderr.trimEnd(),
      executionTimeMs: wall,
      netTimeMs:       wall,
      memoryKb:        0,
      exitCode:        0,
      timedOut:        false,
    };
  } catch (err: unknown) {
    cleanup(dir);
    const e = err as { killed?: boolean; stderr?: string; stdout?: string; code?: number };
    const wall = Date.now() - start;
    return {
      stdout:          e.stdout?.trimEnd() ?? '',
      stderr:          e.stderr?.trimEnd() ?? '',
      executionTimeMs: wall,
      netTimeMs:       wall,
      memoryKb:        0,
      exitCode:        e.code ?? 1,
      timedOut:        e.killed ?? false,
    };
  }
}

function cleanup(dir: string) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}
