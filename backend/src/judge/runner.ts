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

// Read env vars as functions so tests can override process.env at runtime
const getTimeoutMs  = () => Number(process.env.JUDGE_TIMEOUT_MS  ?? 10000);
const getMemoryMb   = () => Number(process.env.JUDGE_MEMORY_MB   ?? 256);
const getUseDocker  = () => process.env.JUDGE_USE_DOCKER === 'true';

// On Windows, native process spawn adds ~400-700ms overhead per invocation.
const SPAWN_OVERHEAD_MS = process.platform === 'win32' ? 600 : 0;

// Max stdout/stderr to buffer — prevents OOM from infinite-printing programs
const MAX_OUTPUT_BYTES = 1 * 1024 * 1024; // 1 MB

const PYTHON_BIN = process.platform === 'win32' ? 'python' : 'python3';
const IS_WIN     = process.platform === 'win32';

/**
 * Write source file without BOM.
 * Node's 'utf8' encoding on Windows can emit a UTF-8 BOM through certain
 * PowerShell / inherited stdio paths. We use Buffer directly to guarantee
 * no BOM, which is critical for javac.
 */
function writeSourceFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
}

function getJavaClassName(code: string): string {
  // Strip line and block comments before searching so a class name that
  // only appears in a comment is never selected.
  const stripped = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const publicMatch = stripped.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  if (publicMatch?.[1]) return publicMatch[1];
  const classMatch = stripped.match(/\bclass\s+([A-Za-z0-9_]+)/);
  if (classMatch?.[1]) return classMatch[1];
  return 'Solution';
}

const LANG_CONFIG: Record<string, {
  ext: string;
  image: string;
  buildCmd?: (src: string, out: string) => string[];
  runCmd:    (src: string, out: string) => string[];
}> = {
  python: {
    ext:    'py',
    image:  'python:3.11-alpine',
    runCmd: (src) => [PYTHON_BIN, '-u', src],   // -u = unbuffered stdout
  },
  javascript: {
    ext:    'js',
    image:  'node:20-alpine',
    runCmd: (src) => ['node', src],
  },
  cpp: {
    ext:      'cpp',
    image:    'gcc:13',
    buildCmd: (src, out) => ['g++', '-O2', '-std=c++17', '-o', out, src],
    runCmd:   (_src, out) => [out],
  },
  java: {
    ext:      'java',
    image:    'eclipse-temurin:21-jdk-alpine',
    // -encoding UTF-8 prevents javac from using the system default (e.g. GBK
    // on Chinese Windows), which would corrupt any non-ASCII string literals.
    buildCmd: (src) => ['javac', '-encoding', 'UTF-8', src],
    runCmd:   (src) => ['java', '-cp', path.dirname(src), path.basename(src, '.java')],
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

  if (getUseDocker()) return runInDocker(language, code, stdin, cfg);
  return runNative(language, code, stdin, cfg);
}

// ── Native runner (dev mode, no Docker) ──────────────────────────────────────
async function runNative(
  language: string,
  code: string,
  stdin: string,
  cfg: typeof LANG_CONFIG[string],
): Promise<RunResult> {
  const TIMEOUT_MS = getTimeoutMs();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));

  const javaClassName = language === 'java' ? getJavaClassName(code) : 'Solution';
  const srcFile = path.join(
    dir,
    language === 'java' ? `${javaClassName}.${cfg.ext}` : `solution.${cfg.ext}`,
  );
  // On Windows, compiled C++ binary needs .exe extension to be executable
  const binFile = path.join(dir, IS_WIN ? 'solution.exe' : 'solution');

  writeSourceFile(srcFile, code);

  // ── Compile step ──────────────────────────────────────────────────────────
  if (cfg.buildCmd) {
    // Build the args array ONCE so srcFile/binFile are consistent
    const compileArgs = cfg.buildCmd(srcFile, binFile);
    const [compileCmd, ...compileCmdArgs] = compileArgs;

    try {
      await execFileAsync(compileCmd, compileCmdArgs, {
        timeout: TIMEOUT_MS,
        cwd: dir,
      });
    } catch (err: unknown) {
      cleanup(dir);
      const e = err as { stderr?: string; stdout?: string; message?: string };
      return {
        stdout:          '',
        stderr:          (e.stderr || e.stdout || e.message || 'Compilation failed').trim(),
        executionTimeMs: 0,
        netTimeMs:       0,
        memoryKb:        0,
        exitCode:        1,
        timedOut:        false,
      };
    }
  }

  // ── Run step ──────────────────────────────────────────────────────────────
  // Write stdin to a temp file so we can pipe it via fs.createReadStream.
  // This avoids the Windows issue where spawning node-from-node causes the
  // child to inherit the parent's console stdin handle and block forever.
  const stdinFile = path.join(dir, 'stdin.txt');
  fs.writeFileSync(stdinFile, Buffer.from(stdin ?? '', 'utf8'));

  const runArgs = cfg.runCmd(srcFile, binFile);
  const start   = Date.now();

  return new Promise((resolve) => {
    let stdout      = '';
    let stderr      = '';
    let timedOut    = false;
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled     = false;

    const child = spawn(runArgs[0], runArgs.slice(1), {
      cwd: dir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      // Use 'pipe' for all — we feed stdin from the file via a read stream
      // instead of child.stdin.write so the child always gets a clean EOF.
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch { /* already exited */ }
    }, TIMEOUT_MS);

    const finish = (exitCode: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup(dir);
      const wall = Date.now() - start;
      resolve({
        stdout:          stdout.trimEnd(),
        stderr:          stderr.trimEnd(),
        executionTimeMs: wall,
        netTimeMs:       Math.max(0, wall - SPAWN_OVERHEAD_MS),
        memoryKb:        0,
        exitCode,
        timedOut,
      });
    };

    child.on('error', (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup(dir);
      resolve({
        stdout:          '',
        stderr:          `Execution error: ${err.message}`,
        executionTimeMs: 0,
        netTimeMs:       0,
        memoryKb:        0,
        exitCode:        1,
        timedOut:        false,
      });
    });

    // Pipe the stdin file into the child's stdin, then close it.
    // Using a ReadStream guarantees EOF is sent when the file ends,
    // even when the parent process itself has an open stdin pipe
    // (which would otherwise block the child on Windows Node v22+).
    const stdinStream = fs.createReadStream(stdinFile);
    stdinStream.pipe(child.stdin);
    stdinStream.on('error', () => {
      try { child.stdin.end(); } catch { /* ignore */ }
    });

    child.stdout.on('data', (d: Buffer) => {
      stdoutBytes += d.length;
      if (stdoutBytes <= MAX_OUTPUT_BYTES) stdout += d.toString('utf8');
    });

    child.stderr.on('data', (d: Buffer) => {
      stderrBytes += d.length;
      if (stderrBytes <= MAX_OUTPUT_BYTES) stderr += d.toString('utf8');
    });

    child.on('close', (code) => {
      finish(code ?? 1);
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
  const TIMEOUT_MS = getTimeoutMs();
  const MEMORY_MB  = getMemoryMb();

  const dir     = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));
  const javaClassName = language === 'java' ? getJavaClassName(code) : 'Solution';
  const srcName = language === 'java' ? `${javaClassName}.${cfg.ext}` : `solution.${cfg.ext}`;
  const srcFile = path.join(dir, srcName);

  writeSourceFile(srcFile, code);
  fs.writeFileSync(path.join(dir, 'stdin.txt'), Buffer.from(stdin ?? '', 'utf8'));

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
    '-v', `${dir}:/code:rw`,
    cfg.image,
    'sh', '-c', shellCmd,
  ];

  const start = Date.now();
  const DOCKER_OVERHEAD = 2200;

  try {
    const { stdout, stderr } = await execFileAsync('docker', args, {
      timeout: TIMEOUT_MS + 3000,
      maxBuffer: MAX_OUTPUT_BYTES,
    });
    cleanup(dir);
    const wall = Date.now() - start;
    const net  = Math.max(0, wall - DOCKER_OVERHEAD);
    return {
      stdout:          stdout.trimEnd(),
      stderr:          stderr.trimEnd(),
      executionTimeMs: net,
      netTimeMs:       net,
      memoryKb:        0,
      exitCode:        0,
      timedOut:        false,
    };
  } catch (err: unknown) {
    cleanup(dir);
    const e = err as { killed?: boolean; stderr?: string; stdout?: string; code?: number };
    const wall = Date.now() - start;
    const net  = Math.max(0, wall - DOCKER_OVERHEAD);
    return {
      stdout:          (e.stdout ?? '').trimEnd(),
      stderr:          (e.stderr ?? '').trimEnd(),
      executionTimeMs: net,
      netTimeMs:       net,
      memoryKb:        0,
      exitCode:        e.code ?? 1,
      timedOut:        e.killed ?? false,
    };
  }
}

function cleanup(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[judge] Failed to clean up ${dir}:`, (err as Error).message);
  }
}
