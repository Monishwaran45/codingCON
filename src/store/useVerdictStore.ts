import { create } from 'zustand';
import { Verdict, TestCaseResult } from '@/types';
import { API_BASE_URL } from '@/lib/constants';
import { socketService, SubmissionProgressEvent } from '@/lib/socket';

interface VerdictState {
  isStreaming: boolean;
  submissionId: string | null;
  /** The problemId belonging to the in-flight / most-recent submission */
  currentProblemId: string | null;
  verdict: Verdict | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryKb: number;
  testCaseResults: TestCaseResult[];
  failedTestCase: TestCaseResult | null;
  submitCode: (
    problemId: string,
    language: string,
    code: string,
    isSubmit: boolean,
    contestId?: string,
  ) => Promise<void>;
  updateVerdictFromSocket: (
    data: Partial<VerdictState> & { testCaseResult?: TestCaseResult; isStreaming?: boolean },
  ) => void;
  resetVerdict: () => void;
}

/** Poll GET /api/submissions/:id until it has a final verdict */
async function pollForResult(
  submissionId: string,
  token: string | undefined,
  onResult: (data: SubmissionProgressEvent) => void,
  maxAttempts = 15,
  intervalMs = 2000,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    try {
      const res = await fetch(`${API_BASE_URL}/submissions/${submissionId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) continue;

      const data = await res.json();

      if (data.verdict && data.verdict !== 'running') {
        // Build failed test case from testCaseResults if available
        let failedTestCase = null;
        if (data.verdict !== 'AC' && data.testCaseResults?.length) {
          const failed = data.testCaseResults.find((tc: any) => !tc.passed);
          if (failed) {
            failedTestCase = {
              id: failed.id,
              passed: false,
              expectedOutput: failed.expectedOutput || '',
              actualOutput: failed.actualOutput || '',
              executionTimeMs: failed.executionTimeMs || 0,
              memoryKb: failed.memoryKb || 0,
              error: failed.error,
            };
          }
        }

        onResult({
          submissionId,
          verdict: data.verdict,
          passedTestCases: data.passedTestCases ?? 0,
          totalTestCases: data.totalTestCases ?? 0,
          executionTimeMs: data.executionTimeMs ?? 0,
          memoryKb: data.memoryKb ?? 0,
          isStreaming: false,
          failedTestCase: failedTestCase ?? undefined,
        });
        return;
      }
    } catch {
      // Network error — try again
    }
  }

  // If we exhausted attempts, show error state
  onResult({
    submissionId,
    verdict: 'RE',
    passedTestCases: 0,
    totalTestCases: 0,
    isStreaming: false,
  });
}

export const useVerdictStore = create<VerdictState>((set, get) => ({
  isStreaming: false,
  submissionId: null,
  currentProblemId: null,
  verdict: null,
  passedTestCases: 0,
  totalTestCases: 0,
  executionTimeMs: 0,
  memoryKb: 0,
  testCaseResults: [],
  failedTestCase: null,

  resetVerdict: () =>
    set({
      isStreaming: false,
      submissionId: null,
      currentProblemId: null,
      verdict: null,
      passedTestCases: 0,
      totalTestCases: 0,
      executionTimeMs: 0,
      memoryKb: 0,
      testCaseResults: [],
      failedTestCase: null,
    }),

  submitCode: async (
    problemId: string,
    language: string,
    code: string,
    isSubmit: boolean,
    contestId?: string,
  ) => {
    if (get().isStreaming) return;

    get().resetVerdict();
    // Store the problemId so updateVerdictFromSocket can reference it
    set({ isStreaming: true, verdict: 'running', currentProblemId: problemId });

    const { useContestStore } = await import('@/store/useContestStore');
    const { useAuthStore } = await import('@/store/useAuthStore');
    const effectiveContestId = contestId || useContestStore.getState().contest?.id;
    const token = useAuthStore.getState().user?.token;

    // ──────────────────────────────────────────────────────────────────────
    // FIX: Connect the socket and prepare the event handler BEFORE posting
    // the submission. This eliminates the race condition where the judge
    // finishes before the frontend subscribes to the room.
    // ──────────────────────────────────────────────────────────────────────
    let socketReceivedFinal = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const socketHandler = (data: SubmissionProgressEvent) => {
      socketReceivedFinal = socketReceivedFinal || data.isStreaming === false;
      get().updateVerdictFromSocket(data);

      // If this is the final event, cancel the polling fallback
      if (data.isStreaming === false && pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    // Ensure socket is connected before we POST
    try {
      await socketService.waitForConnection(3000);
    } catch {
      console.warn('[Verdict] Socket connection failed — will rely on polling fallback');
    }

    // ── POST the submission ──────────────────────────────────────────────
    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ problemId, language, code, isSubmit, contestId: effectiveContestId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ isStreaming: false, verdict: 'RE', failedTestCase: null });
      console.error('[Judge] Submission failed:', (body as { error?: string }).error);
      return;
    }

    const data = (await res.json()) as { id: string; totalTestCases: number };
    set({ submissionId: data.id, totalTestCases: data.totalTestCases });

    // NOW subscribe to the socket room with the real submission ID
    socketService.subscribeToSubmission(data.id, socketHandler);

    // ── Polling fallback ─────────────────────────────────────────────────
    // If the socket doesn't deliver the final verdict within 5 seconds,
    // start polling the REST API as a fallback.
    pollTimer = setTimeout(() => {
      if (!socketReceivedFinal && get().isStreaming) {
        console.log('[Verdict] Socket timed out — falling back to REST polling');
        pollForResult(data.id, token, (result) => {
          if (!socketReceivedFinal) {
            get().updateVerdictFromSocket(result);
          }
        });
      }
    }, 5000);
  },

  updateVerdictFromSocket: (data) => {
    set((state) => {
      const updatedResults = data.testCaseResult
        ? [...state.testCaseResults, data.testCaseResult]
        : state.testCaseResults;

      let failedTestCase = data.failedTestCase ?? state.failedTestCase;
      if (!failedTestCase && data.testCaseResult && !data.testCaseResult.passed) {
        failedTestCase = {
          id: data.testCaseResult.id,
          passed: false,
          expectedOutput: data.testCaseResult.expectedOutput || '',
          actualOutput: data.testCaseResult.actualOutput || '',
          executionTimeMs: data.testCaseResult.executionTimeMs || 0,
          memoryKb: data.testCaseResult.memoryKb || 0,
          error: data.testCaseResult.error,
        };
      }

      return {
        ...state,
        ...data,
        failedTestCase,
        testCaseResults: updatedResults,
      };
    });

    // When the final verdict is AC (isStreaming=false means it's the done event),
    // immediately mark the problem as solved in the contest store so the problem
    // list row flips to the green "Solved" badge without any page reload.
    // Also refresh the auth user so Max Score + Solved count update live.
    if (data.verdict === 'AC' && data.isStreaming === false) {
      const problemId = get().currentProblemId;

      if (problemId) {
        import('@/store/useContestStore').then(({ useContestStore }) => {
          const { contest, markProblemSolved } = useContestStore.getState();
          if (contest) markProblemSolved(problemId);
        });
      }

      // Re-fetch /auth/me so totalPoints and solvedCount reflect the new solve.
      // Small delay ensures the worker's DB write has committed before we read.
      import('@/store/useAuthStore').then(({ useAuthStore }) => {
        setTimeout(() => useAuthStore.getState().refreshUser(), 800);
      });
    }
  },
}));
