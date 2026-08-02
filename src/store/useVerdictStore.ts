import { create } from 'zustand';
import { Verdict, TestCaseResult } from '@/types';

interface VerdictState {
  isStreaming: boolean;
  verdict: Verdict | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryKb: number;
  testCaseResults: TestCaseResult[];
  failedTestCase: TestCaseResult | null;
  runMockSubmission: (code: string, isSubmit: boolean) => void;
  resetVerdict: () => void;
}

export const useVerdictStore = create<VerdictState>((set) => ({
  isStreaming: false,
  verdict: null,
  passedTestCases: 0,
  totalTestCases: 0,
  executionTimeMs: 0,
  memoryKb: 0,
  testCaseResults: [],
  failedTestCase: null,
  resetVerdict: () => set({
    isStreaming: false,
    verdict: null,
    passedTestCases: 0,
    totalTestCases: 0,
    executionTimeMs: 0,
    memoryKb: 0,
    testCaseResults: [],
    failedTestCase: null,
  }),
  runMockSubmission: (code: string, isSubmit: boolean) => {
    const total = isSubmit ? 15 : 2;
    set({
      isStreaming: true,
      verdict: 'running',
      passedTestCases: 0,
      totalTestCases: total,
      executionTimeMs: 0,
      memoryKb: 0,
      testCaseResults: [],
      failedTestCase: null,
    });

    const isSuccess = !code.includes('error') && code.length > 25;
    let currentPassed = 0;

    const interval = setInterval(() => {
      currentPassed++;
      const newResult: TestCaseResult = {
        id: currentPassed,
        passed: isSuccess || currentPassed < Math.floor(total * 0.7),
        executionTimeMs: Math.floor(10 + Math.random() * 20),
        memoryKb: Math.floor(12000 + Math.random() * 4000),
        expectedOutput: isSuccess ? '15 4' : '15 4',
        actualOutput: (isSuccess || currentPassed < Math.floor(total * 0.7)) ? '15 4' : '0 0',
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
          executionTimeMs: 14,
          memoryKb: 13400,
        });
        return;
      }

      if (currentPassed >= total) {
        clearInterval(interval);
        set({
          isStreaming: false,
          verdict: 'AC',
          executionTimeMs: 28,
          memoryKb: 14800,
        });
      }
    }, 180);
  },
}));
