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
import { CustomInputPanel } from '@/components/verdict/CustomInputPanel';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useEditorStore } from '@/store/useEditorStore';
import { useVerdictStore } from '@/store/useVerdictStore';
import { useSubmissionSocket } from '@/hooks/useSocket';

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = (params?.id as string) || '';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leftTab, setLeftTab] = useState<'statement' | 'submissions' | 'hints'>('statement');
  const [verdictTab, setVerdictTab] = useState<'testcases' | 'custom'>('testcases');
  const [customOutput, setCustomOutput] = useState<string | undefined>(undefined);

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

  // Global hotkeys: Ctrl+Enter (Run), Ctrl+Shift+Enter (Submit)
  useEffect(() => {
    const handleHotkeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          submitCode(problemId, language, code, true);
        } else {
          submitCode(problemId, language, code, false);
        }
      }
    };
    window.addEventListener('keydown', handleHotkeys);
    return () => window.removeEventListener('keydown', handleHotkeys);
  }, [problemId, language, code, submitCode]);

  const handleRunCustomInput = (input: string) => {
    setCustomOutput(`Mock stdout output for input:\n${input || '(empty)'}\nExecution successful. (0ms)`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonLoader count={1} className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-jetbrains">
        <p className="text-xs text-zinc-500 mb-4">The requested problem could not be found.</p>
        <Link href="/problems" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold">
          Return to Problem Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-53px)] w-full overflow-hidden bg-white dark:bg-zinc-950 font-jetbrains transition-colors duration-150">
      {/* Left Pane: Tabbed Problem Workspace */}
      <div className="w-1/2 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        {/* Left Header Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-500">
          <button
            onClick={() => setLeftTab('statement')}
            className={`px-3 py-1 rounded-md transition-colors ${
              leftTab === 'statement'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setLeftTab('submissions')}
            className={`px-3 py-1 rounded-md transition-colors ${
              leftTab === 'submissions'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            My Submissions
          </button>
          <button
            onClick={() => setLeftTab('hints')}
            className={`px-3 py-1 rounded-md transition-colors ${
              leftTab === 'hints'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Notes & Hints 💡
          </button>
        </div>

        {/* Left Content Area */}
        <div className="flex-1 overflow-y-auto">
          {leftTab === 'statement' && <ProblemStatement problem={problem} />}
          {leftTab === 'submissions' && (
            <div className="p-6 text-xs text-zinc-500 space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[0.65rem]">
                Submission History for {problem.title}
              </h3>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[0.65rem] uppercase text-zinc-400">
                    <tr>
                      <th className="py-2 px-3">Verdict</th>
                      <th className="py-2 px-3">Language</th>
                      <th className="py-2 px-3">Runtime</th>
                      <th className="py-2 px-3">Memory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">ACCEPTED</td>
                      <td className="py-2.5 px-3 font-mono">C++ 20</td>
                      <td className="py-2.5 px-3 font-mono">8 ms</td>
                      <td className="py-2.5 px-3 font-mono">1.2 MB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {leftTab === 'hints' && (
            <div className="p-6 text-xs text-zinc-600 dark:text-zinc-400 space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[0.65rem]">
                Algorithmic Tips & Complexity Constraints
              </h3>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  Target Time Complexity: <code className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded font-mono">O(N log N)</code> or <code className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded font-mono">O(N)</code>.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Consider using a Hash Map or Two-Pointer approach if input array is sorted. Beware of integer overflow for large input bounds.
                </p>
              </div>
            </div>
          )}
        </div>
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

        {/* Real-time Verdict & Test Case Panel */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 max-h-[320px] overflow-y-auto transition-colors duration-150">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-3">
            <button
              onClick={() => setVerdictTab('testcases')}
              className={`text-xs font-bold transition-colors ${
                verdictTab === 'testcases' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Evaluation Results
            </button>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <button
              onClick={() => setVerdictTab('custom')}
              className={`text-xs font-bold transition-colors ${
                verdictTab === 'custom' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Custom Test Input
            </button>
          </div>

          {verdictTab === 'custom' ? (
            <CustomInputPanel
              onRunCustomInput={handleRunCustomInput}
              isStreaming={isStreaming}
              customOutput={customOutput}
            />
          ) : verdict || isStreaming ? (
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
            <div className="font-jetbrains text-center text-xs text-zinc-500 py-3">
              Press <strong className="text-zinc-700 dark:text-zinc-300">Run Code</strong> (<kbd className="font-mono text-[0.65rem] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Ctrl+Enter</kbd>) to evaluate sample cases, or <strong className="text-blue-600 dark:text-blue-400">Submit Solution</strong> (<kbd className="font-mono text-[0.65rem] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Ctrl+Shift+Enter</kbd>) to run hidden test suite.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

