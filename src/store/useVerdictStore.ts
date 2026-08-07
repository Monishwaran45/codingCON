import { create } from 'zustand';
import { Verdict, TestCaseResult } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

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
    const effectiveContestId = contestId || useContestStore.getState().contest?.id;

    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    // Real-time progress arrives via Socket.IO → updateVerdictFromSocket
  },

  updateVerdictFromSocket: (data) => {
    set((state) => {
      const updatedResults = data.testCaseResult
        ? [...state.testCaseResults, data.testCaseResult]
        : state.testCaseResults;
      return { ...state, ...data, testCaseResults: updatedResults };
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
