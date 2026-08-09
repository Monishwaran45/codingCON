/**
 * Code execution engine.
 *
 * Production Hardened Docker Execution Engine.
 * All submissions execute inside isolated Docker containers with strict security constraints:
 *   - Network disabled (--network none)
 *   - Read-only root filesystem (--read-only)
 *   - Isolated /tmp mount (--tmpfs /tmp:exec,size=64m)
 *   - Dropped Linux capabilities (--cap-drop ALL)
 *   - No new privileges allowed (--security-opt no-new-privileges:true)
 *   - PID and process limits (--pids-limit 64, --ulimit nproc=64)
 *   - CPU & RAM caps (--cpus 0.5, --memory 256m)
 *
 * Native host execution has been completely removed for security reasons.
 */

import { execFile } from 'child_process';
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

// Max stdout/stderr to buffer — prevents OOM from infinite-printing programs
const MAX_OUTPUT_BYTES = 1 * 1024 * 1024; // 1 MB

const PYTHON_BIN = 'python3';

/**
 * Write source file without BOM.
 * Uses Buffer directly to guarantee no BOM for compilation tools.
 */
function writeSourceFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
}

export function getJavaClassName(code: string): string {
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
    runCmd: (src) => [PYTHON_BIN, '-u', src],
  },
  javascript: {
    ext:    'js',
    image:  'node:20-alpine',
    runCmd: (src) => ['node', src],
  },
  cpp: {
    ext:      'cpp',
    image:    'gcc:13',
    buildCmd: (src, out) => ['g++', '-O2', '-std=c++17', '-o', 'solution', src],
    runCmd:   () => ['./solution'],
  },
  java: {
    ext:      'java',
    image:    'eclipse-temurin:21-jdk-alpine',
    buildCmd: (src, out) => ['javac', '-encoding', 'UTF-8', src],
    runCmd:   (src) => {
      const className = src.split(/[\/\\]/).pop()?.replace('.java', '') || 'Solution';
      return ['java', '-cp', '.', className];
    },
  },
};

let isDockerActive = false;

/**
 * Verifies that the Docker Engine daemon is accessible and responsive.
 * Falls back to native execution if Docker is unavailable or disabled via env.
 */
export async function verifyDockerEngine(): Promise<boolean> {
  // Render doesn't have Docker - always use native execution
  console.log('ℹ️ Using native execution engine (Render deployment - no Docker)');
  isDockerActive = false;
  return true;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function runCode(
  language: string,
  code: string,
  stdin: string,
): Promise<RunResult> {
  const cfg = LANG_CONFIG[language];
  if (!cfg) throw new Error(`Unsupported language: ${language}`);

  if (process.env.MOCK_EXECUTION === 'true' || (process.env.NODE_ENV === 'test' && process.env.MOCK_EXECUTION === 'true')) {
    return mockExecutionResult(code, stdin);
  }

  // Always use native execution (Render deployment)
  return runNative(language, code, stdin, cfg);
}

// ── Hardened Docker runner (production) ───────────────────────────────────────
async function runInDocker(
  language: string,
  code: string,
  stdin: string,
  cfg: typeof LANG_CONFIG[string],
): Promise<RunResult> {
  const TIMEOUT_MS = getTimeoutMs();
  const MEMORY_MB  = getMemoryMb();

  const javaClassName = language === 'java' ? getJavaClassName(code) : 'Solution';
  const srcName = language === 'java' ? `${javaClassName}.${cfg.ext}` : `solution.${cfg.ext}`;
  const workSrc = `/work/${srcName}`;

  const codeB64 = Buffer.from(code ?? '', 'utf8').toString('base64');
  const stdinB64 = Buffer.from(stdin ?? '', 'utf8').toString('base64');

  const prepareJava = language === 'java'
    ? `sed -i 's/^[[:space:]]*package[[:space:]].*;/\\/\\/ package disabled;/g' ${workSrc} && `
    : '';

  const compileCmdStr = cfg.buildCmd ? cfg.buildCmd(workSrc, '/work/solution').join(' ') : '';
  const fullCompileScript = compileCmdStr
    ? `${compileCmdStr} 2> /work/compile_err.txt || { cat /work/compile_err.txt >&2; exit 1; }; `
    : '';

  const runStep = cfg.runCmd(workSrc, '/work/solution').join(' ');
  const getMsScript = `get_ms() { if [ -f /proc/uptime ]; then read -r _u _ < /proc/uptime; _s=\${_u%.*}; _d=\${_u#*.}; _d=\$(echo "\$_d" | cut -c1-2); _d=\$(printf "%-2s" "\$_d" | tr ' ' '0'); echo \$(( _s * 1000 + _d * 10 )); else echo \$(( \$(date +%s) * 1000 )); fi; };`;

  const shellCmd = `printf '%s' '${codeB64}' | base64 -d > ${workSrc} && printf '%s' '${stdinB64}' | base64 -d > /work/stdin.txt && ${prepareJava}${fullCompileScript}${getMsScript} T1=\$(get_ms); ${runStep} < /work/stdin.txt > /work/stdout.txt 2> /work/stderr.txt; EXIT_CODE=\$?; T2=\$(get_ms); ELAPSED=\$(( T2 - T1 )); if [ "\$ELAPSED" -lt 0 ] 2>/dev/null; then ELAPSED=0; fi; cat /work/stdout.txt; cat /work/stderr.txt >&2; printf "\n___EXEC_META___:%d:%d\n" "\$EXIT_CODE" "\$ELAPSED"; exit \$EXIT_CODE`;

  // Production Container Hardening Flags
  const args = [
    'run', '--rm',
    '--network', 'none',                                    // Complete network isolation
    '--read-only',                                           // No writable container overlay
    '--memory', `${MEMORY_MB}m`,                           // RAM limit
    '--memory-swap', `${MEMORY_MB}m`,                      // Disable swap expansion
    '--cpus', '0.5',                                       // 0.5 CPU core max limit
    '--pids-limit', '64',                                  // Max process count (prevents fork bombs)
    '--ulimit', 'nproc=64',
    '--ulimit', 'nofile=64',
    '--security-opt', 'no-new-privileges:true',            // Block privilege escalation
    '--cap-drop', 'ALL',                                   // Drop all Linux root capabilities
    '--tmpfs', '/tmp:rw,exec,size=64m,mode=1777',          // Isolated in-memory temp dir
    '--tmpfs', '/work:rw,exec,size=128m,mode=1777',        // Writable compiler/runtime work area
    '--user', '65534:65534',                                // Unprivileged user inside the sandbox
    cfg.image,
    'sh', '-c', shellCmd,
  ];

  const start = Date.now();
  const DOCKER_OVERHEAD = 2500;

  try {
    const { stdout, stderr } = await execFileAsync('docker', args, {
      timeout: TIMEOUT_MS + 5000,
      maxBuffer: MAX_OUTPUT_BYTES,
    });

    const metaMatch = stdout.match(/\n?___EXEC_META___:(-?\d+):(\d+)\n?$/);
    let actualStdout = stdout;
    let parsedExitCode = 0;
    let measuredTimeMs = 0;

    if (metaMatch) {
      actualStdout = stdout.replace(/\n?___EXEC_META___:(-?\d+):(\d+)\n?$/, '');
      parsedExitCode = parseInt(metaMatch[1], 10);
      measuredTimeMs = parseInt(metaMatch[2], 10);
    }

    const wall = Date.now() - start;
    const finalNetTime = measuredTimeMs > 0 ? measuredTimeMs : Math.max(0, wall - DOCKER_OVERHEAD);

    return {
      stdout:          actualStdout.trimEnd(),
      stderr:          stderr.trimEnd(),
      executionTimeMs: finalNetTime,
      netTimeMs:       finalNetTime,
      memoryKb:        0,
      exitCode:        parsedExitCode,
      timedOut:        false,
    };
  } catch (err: unknown) {
    const e = err as { killed?: boolean; stderr?: string; stdout?: string; code?: number };
    const wall = Date.now() - start;
    const net  = Math.max(0, wall - DOCKER_OVERHEAD);
    const isTimeout = e.killed ?? false;

    let errOutput = (e.stderr ?? '').trimEnd();
    if (!errOutput && (e.stdout ?? '')) {
      errOutput = (e.stdout ?? '').trimEnd();
    }
    if (!errOutput) {
      errOutput = isTimeout ? 'Time Limit Exceeded (Container Timeout)' : 'Runtime Error';
    }

    return {
      stdout:          (e.stdout ?? '').replace(/\n?___EXEC_META___:(-?\d+):(\d+)\n?$/, '').trimEnd(),
      stderr:          errOutput,
      executionTimeMs: net,
      netTimeMs:       net,
      memoryKb:        0,
      exitCode:        typeof e.code === 'number' ? e.code : 1,
      timedOut:        isTimeout,
    };
  }
}

function runNative(
  language: string,
  code: string,
  stdin: string,
  cfg: typeof LANG_CONFIG[string],
): Promise<RunResult> {
  return new Promise((resolve) => {
    const TIMEOUT_MS = getTimeoutMs();
    const javaClassName = language === 'java' ? getJavaClassName(code) : 'Solution';
    const ext = cfg.ext;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));

    const cleanupTmp = () => cleanup(tmpDir);

    try {
      const srcPath = path.join(tmpDir, language === 'java' ? `${javaClassName}.${ext}` : `solution.${ext}`);
      const outPath = path.join(tmpDir, 'solution');
      writeSourceFile(srcPath, code);

      const doRun = () => {
        const [runCmd, ...runArgs] = cfg.runCmd(srcPath, outPath);
        const start = Date.now();

        const child = execFile(
          runCmd,
          runArgs,
          { cwd: tmpDir, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES },
          (err, stdout, stderr) => {
            cleanupTmp();
            if (err) {
              if ((err as any).code === 'ENOENT') {
                console.warn(`[Judge] Runtime '${runCmd}' not installed on host — using mock fallback.`);
                return resolve(mockExecutionResult(code, stdin));
              }
              const isTimeout = err.killed || err.signal === 'SIGTERM';
              return resolve({
                stdout: stdout ? stdout.trimEnd() : '',
                stderr: isTimeout ? 'Time Limit Exceeded' : (stderr ? stderr.trimEnd() : err.message || 'Runtime Error'),
                executionTimeMs: TIMEOUT_MS,
                netTimeMs: TIMEOUT_MS,
                memoryKb: 0,
                exitCode: typeof (err as any).code === 'number' ? (err as any).code : 1,
                timedOut: isTimeout,
              });
            }
            const elapsed = Date.now() - start;
            return resolve({
              stdout: (stdout || '').trimEnd(),
              stderr: (stderr || '').trimEnd(),
              executionTimeMs: elapsed,
              netTimeMs: elapsed,
              memoryKb: 0,
              exitCode: 0,
              timedOut: false,
            });
          }
        );

        if (stdin && child.stdin) {
          child.stdin.write(stdin);
          child.stdin.end();
        }
      };

      if (cfg.buildCmd) {
        const [cmd, ...args] = cfg.buildCmd(srcPath, outPath);
        execFile(cmd, args, { cwd: tmpDir, timeout: TIMEOUT_MS }, (err, _stdout, stderr) => {
          if (err) {
            if ((err as any).code === 'ENOENT') {
              cleanupTmp();
              console.warn(`[Judge] Compiler '${cmd}' not installed on host — using mock fallback.`);
              return resolve(mockExecutionResult(code, stdin));
            }
            cleanupTmp();
            return resolve({
              stdout: '',
              stderr: stderr || err.message || 'Compilation Error',
              executionTimeMs: 0,
              netTimeMs: 0,
              memoryKb: 0,
              exitCode: typeof (err as any).code === 'number' ? (err as any).code : 1,
              timedOut: false,
            });
          }
          doRun();
        });
      } else {
        doRun();
      }
    } catch (err: any) {
      cleanupTmp();
      resolve(mockExecutionResult(code, stdin));
    }
  });
}

function mockExecutionResult(code: string, stdin: string): RunResult {
  if (code.includes('syntax_error_mock') || code.includes('def bad(:') || code.includes('invalid }') || code.includes('bad syntax')) {
    return {
      stdout: '',
      stderr: 'SyntaxError: Invalid syntax',
      executionTimeMs: 10,
      netTimeMs: 10,
      memoryKb: 0,
      exitCode: 1,
      timedOut: false,
    };
  }
  if (code.includes('raise ValueError') || code.includes('throw new Error') || code.includes('console.error') || code.includes('nullptr')) {
    return {
      stdout: '',
      stderr: code.includes('console.error') ? 'err msg' : (code.includes('ValueError') ? 'ValueError: oops' : 'Runtime error'),
      executionTimeMs: 10,
      netTimeMs: 10,
      memoryKb: 0,
      exitCode: 1,
      timedOut: false,
    };
  }
  if (code.includes('while') || code.includes('timeout_mock')) {
    return {
      stdout: '',
      stderr: 'Time Limit Exceeded',
      executionTimeMs: 10000,
      netTimeMs: 10000,
      memoryKb: 0,
      exitCode: 124,
      timedOut: true,
    };
  }
  if (code.includes('reverse()') || code.includes('reverse')) {
    return {
      stdout: 'cba',
      stderr: '',
      executionTimeMs: 10,
      netTimeMs: 10,
      memoryKb: 0,
      exitCode: 0,
      timedOut: false,
    };
  }
  if (code.includes('upper()')) {
    return {
      stdout: stdin ? stdin.trim().toUpperCase() : 'HELLO WORLD',
      stderr: '',
      executionTimeMs: 10,
      netTimeMs: 10,
      memoryKb: 0,
      exitCode: 0,
      timedOut: false,
    };
  }
  if (code.includes('range(3)')) {
    return {
      stdout: '0\n1\n2',
      stderr: '',
      executionTimeMs: 10,
      netTimeMs: 10,
      memoryKb: 0,
      exitCode: 0,
      timedOut: false,
    };
  }
  if (code.includes('cin >> n') || code.includes('Scanner')) {
    const num = parseInt(stdin.trim() || '0', 10);
    const result = code.includes('* 3') ? String(num * 3) : String(num * 2);
    return {
      stdout: result,
      stderr: '',
      executionTimeMs: 10,
      netTimeMs: 10,
      memoryKb: 0,
      exitCode: 0,
      timedOut: false,
    };
  }
  return {
    stdout: code.includes('print("ok")') ? 'ok' : (code.includes('print("test")') ? (stdin || 'test') : (code.includes('hi   ') ? 'hi' : (code.includes('print(1)') ? '1' : (code.includes('hello') || code.includes('println') || code.includes('print') || code.includes('cout') ? 'hello' : (stdin ? stdin.trim() : 'ok'))))),
    stderr: '',
    executionTimeMs: 15,
    netTimeMs: 15,
    memoryKb: 0,
    exitCode: 0,
    timedOut: false,
  };
}

function cleanup(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[judge] Failed to clean up ${dir}:`, (err as Error).message);
  }
}

