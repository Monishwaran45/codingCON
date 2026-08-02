'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Problem } from '@/types';
import { api } from '@/lib/api';
import { ProblemStatement } from '@/components/problems/ProblemStatement';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { TestCaseProgress } from '@/components/verdict/TestCaseProgress';
import { VerdictBanner } from '@/components/verdict/VerdictBanner';
import { DiffViewer } from '@/components/verdict/DiffViewer';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useEditorStore } from '@/store/useEditorStore';
import { useVerdictStore } from '@/store/useVerdictStore';

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = (params?.id as string) || 'p1';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { language, code, setLanguage, resetCode, lastSavedAt } = useEditorStore();
  const {
    isStreaming,
    verdict,
    passedTestCases,
    totalTestCases,
    executionTimeMs,
    memoryKb,
    testCaseResults,
    failedTestCase,
    runMockSubmission,
    resetVerdict,
  } = useVerdictStore();

  useEffect(() => {
    async function loadProblem() {
      setIsLoading(true);
      const data = await api.getProblemById(problemId);
      setProblem(data);
      setIsLoading(false);
      resetVerdict();
    }
    loadProblem();
  }, [problemId, resetVerdict]);

  if (isLoading || !problem) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonLoader count={1} className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)] w-full overflow-hidden bg-slate-950">
      {/* Left Pane: Scrollable Problem Statement */}
      <div className="w-1/2 border-r border-slate-800 bg-slate-950 overflow-y-auto">
        <ProblemStatement problem={problem} />
      </div>

      {/* Right Pane: Code Editor + Real-time Verdict Workspace */}
      <div className="flex w-1/2 flex-col bg-slate-900">
        {/* Toolbar */}
        <EditorToolbar
          language={language}
          onLanguageChange={setLanguage}
          onReset={resetCode}
          onRun={() => runMockSubmission(code, false)}
          onSubmit={() => runMockSubmission(code, true)}
          isStreaming={isStreaming}
          lastSavedAt={lastSavedAt}
        />

        {/* Monaco Editor Wrapper */}
        <div className="flex-1">
          <CodeEditor height="100%" />
        </div>

        {/* Real-time Verdict Panel */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 max-h-[300px] overflow-y-auto">
          {verdict || isStreaming ? (
            <div className="space-y-4">
              <TestCaseProgress
                passedTestCases={passedTestCases}
                totalTestCases={totalTestCases}
                results={testCaseResults}
                isStreaming={isStreaming}
              />

              {verdict && verdict !== 'running' && (
                <VerdictBanner
                  verdict={verdict}
                  executionTimeMs={executionTimeMs}
                  memoryKb={memoryKb}
                  passedTestCases={passedTestCases}
                  totalTestCases={totalTestCases}
                />
              )}

              {failedTestCase && <DiffViewer failedTestCase={failedTestCase} />}
            </div>
          ) : (
            <div className="font-jetbrains text-center text-xs text-slate-500 py-4">
              Press <strong className="text-slate-300">Run Code</strong> to test sample cases, or <strong className="text-cyan-400">Submit Solution</strong> to evaluate all test suites.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
