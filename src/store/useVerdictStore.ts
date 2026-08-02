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
  submitCode: (problemId: string, language: string, code: string, isSubmit: boolean) => Promise<void>;
  updateVerdictFromSocket: (data: Partial<VerdictState> & { testCaseResult?: TestCaseResult }) => void;
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
  resetVerdict: () => set({
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
  submitCode: async (problemId: string, language: string, code: string, isSubmit: boolean) => {
    get().resetVerdict();
    set({ isStreaming: true, verdict: 'running' });

    // Explicit Feature Flag Gate: Real API vs Dev Mock Judge
    const useMockJudge = process.env.NEXT_PUBLIC_USE_MOCK_JUDGE === 'true';

    if (!useMockJudge) {
      try {
        const res = await fetch(`${API_BASE_URL}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId, language, code, isSubmit }),
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          set({ submissionId: data.id, totalTestCases: data.totalTestCases || (isSubmit ? 15 : 2) });
          return;
        }
      } catch {
        // Endpoint unreachable — error state
      }
    }

    // Dev-only explicit mock judge (Gated via NEXT_PUBLIC_USE_MOCK_JUDGE=true)
    if (useMockJudge) {
      const total = isSubmit ? 15 : 2;
      set({ totalTestCases: total });
      const isSuccess = !code.includes('error') && code.length > 20;
      let currentPassed = 0;

      const interval = setInterval(() => {
        currentPassed++;
        const newResult: TestCaseResult = {
          id: currentPassed,
          passed: isSuccess || currentPassed < Math.floor(total * 0.7),
        };

        set((state) => ({
          passedTestCases: currentPassed,
          testCaseResults: [...state.testCaseResults, newResult],
        }));

        if (!newResult.passed && !isSuccess) {
          clearInterval(interval);
          set({
            isStreaming: false,
            verdict: 'WA',
            failedTestCase: newResult,
          });
          return;
        }

        if (currentPassed >= total) {
          clearInterval(interval);
          set({
            isStreaming: false,
            verdict: 'AC',
          });
        }
      }, 200);
    }
  },
  updateVerdictFromSocket: (data) => {
    set((state) => {
      const updatedResults = data.testCaseResult
        ? [...state.testCaseResults, data.testCaseResult]
        : state.testCaseResults;

      return {
        ...state,
        ...data,
        testCaseResults: updatedResults,
      };
    });
  },
}));
