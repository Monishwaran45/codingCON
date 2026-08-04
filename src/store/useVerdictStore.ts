import { create } from 'zustand';
import { Verdict, TestCaseResult } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

interface VerdictState {
  isStreaming: boolean;
  submissionId: string | null;
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
    data: Partial<VerdictState> & { testCaseResult?: TestCaseResult },
  ) => void;
  resetVerdict: () => void;
}

export const useVerdictStore = create<VerdictState>((set, get) => ({
  isStreaming: false,
  submissionId: null,
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
    set({ isStreaming: true, verdict: 'running' });

    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ problemId, language, code, isSubmit, contestId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({
        isStreaming: false,
        verdict: 'RE',
        failedTestCase: null,
      });
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
  },
}));
