import os
import sys
import tempfile
import asyncio
import time
import subprocess
from pydantic import BaseModel
from typing import Optional

class RunResult(BaseModel):
    stdout: str = ""
    stderr: str = ""
    execution_time_ms: int = 0
    net_time_ms: int = 0
    memory_kb: int = 0
    exit_code: int = 0
    timed_out: bool = False

TIMEOUT_MS = 10000
IS_WINDOWS = sys.platform == "win32"
PYTHON_BIN = "python" if IS_WINDOWS else "python3"

LANG_CONFIG = {
    "python": {
        "ext": "py",
        "run_cmd": lambda src, out: [PYTHON_BIN, src],
    },
    "javascript": {
        "ext": "js",
        "run_cmd": lambda src, out: ["node", src],
    },
    "cpp": {
        "ext": "cpp",
        "build_cmd": lambda src, out: ["g++", "-O2", "-std=c++17", "-o", out, src],
        "run_cmd": lambda src, out: [out],
    },
    "java": {
        "ext": "java",
        "build_cmd": lambda src, out: ["javac", src],
        "run_cmd": lambda src, out: ["java", "-cp", os.path.dirname(src), "Solution"],
    },
}

async def run_code(language: str, code: str, stdin: str) -> RunResult:
    cfg = LANG_CONFIG.get(language)
    if not cfg:
        return RunResult(stderr=f"Unsupported language: {language}", exit_code=1)

    with tempfile.TemporaryDirectory(prefix="judge-") as tmpdir:
        src_name = "Solution." + cfg["ext"] if language == "java" else "solution." + cfg["ext"]
        src_file = os.path.join(tmpdir, src_name)
        bin_name = "solution.exe" if IS_WINDOWS else "solution"
        bin_file = os.path.join(tmpdir, bin_name)

        with open(src_file, "w", encoding="utf-8") as f:
            f.write(code)

        # Build if required
        if "build_cmd" in cfg:
            build_args = cfg["build_cmd"](src_file, bin_file)
            try:
                proc = await asyncio.create_subprocess_exec(
                    *build_args,
                    cwd=tmpdir,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                _, stderr = await proc.communicate()
                if proc.returncode != 0:
                    return RunResult(
                        stderr=stderr.decode(errors="ignore") or "Compilation Error",
                        exit_code=proc.returncode or 1
                    )
            except Exception as e:
                return RunResult(stderr=f"Build error: {e}", exit_code=1)

        # Run process
        run_args = cfg["run_cmd"](src_file, bin_file)
        start_time = time.time()
        try:
            proc = await asyncio.create_subprocess_exec(
                *run_args,
                cwd=tmpdir,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(input=(stdin or "").encode("utf-8")),
                    timeout=TIMEOUT_MS / 1000.0
                )
                wall_ms = int((time.time() - start_time) * 1000)
                return RunResult(
                    stdout=stdout_bytes.decode(errors="ignore").rstrip(),
                    stderr=stderr_bytes.decode(errors="ignore").rstrip(),
                    execution_time_ms=wall_ms,
                    net_time_ms=max(0, wall_ms - (600 if IS_WINDOWS else 0)),
                    exit_code=proc.returncode or 0,
                    timed_out=False
                )
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                wall_ms = int((time.time() - start_time) * 1000)
                return RunResult(
                    stderr="Time Limit Exceeded",
                    execution_time_ms=wall_ms,
                    net_time_ms=wall_ms,
                    exit_code=1,
                    timed_out=True
                )
        except Exception as e:
            return RunResult(stderr=f"Execution spawn error: {e}", exit_code=1)
