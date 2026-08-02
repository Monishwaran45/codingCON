'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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

import { useSubmissionSocket } from '@/hooks/useSocket';

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = (params?.id as string) || '';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { language, code, setLanguage, resetCode, lastSavedAt } = useEditorStore();
  const {
    isStreaming,
    submissionId,
    verdict,
    passedTestCases,
    totalTestCases,
    executionTimeMs,
    memoryKb,
    testCaseResults,
    failedTestCase,
    submitCode,
    updateVerdictFromSocket,
    resetVerdict,
  } = useVerdictStore();

  // Real-time WebSocket connection to NestJS Judge Cluster execution channel
  useSubmissionSocket(submissionId, updateVerdictFromSocket);

  useEffect(() => {
    async function loadProblem() {
      if (!problemId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await api.getProblemById(problemId);
      setProblem(data);
      setIsLoading(false);
      resetVerdict();
    }
    loadProblem();
  }, [problemId, resetVerdict]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonLoader count={1} className="h-[600px] w-full" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-jetbrains">
        <p className="text-xs text-zinc-500 mb-4">The requested problem could not be found.</p>
        <Link href="/problems" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Return to Problem Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-50px)] w-full overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-150">
      {/* Left Pane: Scrollable Problem Statement */}
      <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
        <ProblemStatement problem={problem} />
      </div>

      {/* Right Pane: Code Editor + Real-time Verdict Workspace */}
      <div className="flex w-1/2 flex-col bg-zinc-50 dark:bg-zinc-900 transition-colors duration-150">
        {/* Toolbar */}
        <EditorToolbar
          language={language}
          onLanguageChange={setLanguage}
          onReset={resetCode}
          onRun={() => submitCode(problemId, language, code, false)}
          onSubmit={() => submitCode(problemId, language, code, true)}
          isStreaming={isStreaming}
          lastSavedAt={lastSavedAt}
        />

        {/* Monaco Editor Wrapper */}
        <div className="flex-1">
          <CodeEditor height="100%" />
        </div>

        {/* Real-time Verdict Panel */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 max-h-[300px] overflow-y-auto transition-colors duration-150">
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
            <div className="font-jetbrains text-center text-xs text-zinc-500 py-4">
              Press <strong className="text-zinc-700 dark:text-zinc-300">Run Code</strong> to test sample cases, or <strong className="text-blue-600 dark:text-blue-400">Submit Solution</strong> to evaluate all test cases.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
