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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = (params?.id as string) || '';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leftTab, setLeftTab] = useState<'statement' | 'submissions' | 'hints'>('statement');
  const [verdictTab, setVerdictTab] = useState<'testcases' | 'custom'>('testcases');
  const [customOutput, setCustomOutput] = useState<string | undefined>(undefined);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(220);
  const [isResizing, setIsResizing] = useState(false);

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

  useSubmissionSocket(submissionId, updateVerdictFromSocket);

  useEffect(() => {
    async function loadProblem() {
      if (!problemId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [data, activeContest] = await Promise.all([
        api.getProblemById(problemId),
        api.getActiveContest().catch(() => null),
      ]);
      setProblem(data);
      if (activeContest) {
        const { useContestStore } = await import('@/store/useContestStore');
        useContestStore.getState().setContest(activeContest);
      }
      setIsLoading(false);
      resetVerdict();
    }
    loadProblem();
  }, [problemId, resetVerdict]);

  useEffect(() => {
    if (verdict === 'AC' && problem && !problem.isSolved) {
      setProblem({ ...problem, isSolved: true });
    }
  }, [verdict, problem]);

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

  // Resize handler for the bottom panel
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.min(Math.max(startHeight + delta, 120), 500);
      setBottomPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRunCustomInput = async (input: string) => {
    if (!problem) return;
    setCustomOutput(undefined);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problemId: problem.id, language, code, stdin: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCustomOutput(`Error: ${data.error ?? 'Failed to run code'}`);
        return;
      }
      const out = data.stdout ?? '';
      const err = data.stderr ?? '';
      const ms  = data.executionTimeMs ?? 0;
      if (err && !out) {
        setCustomOutput(`Runtime Error:\n${err}`);
      } else {
        setCustomOutput(
          (out || '(no output)') +
          (err ? `\n\nstderr:\n${err}` : '') +
          `\n\n── ${ms}ms`
        );
      }
    } catch (e) {
      setCustomOutput(`Network error: ${(e as Error).message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full h-[calc(100vh-56px)] p-4 bg-zinc-50 dark:bg-zinc-950">
        <SkeletonLoader count={1} className="h-full w-full rounded-2xl" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center font-inter">
        <div className="glass-panel rounded-2xl p-10 space-y-4">
          <div className="text-3xl">📋</div>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">Problem not found</p>
          <p className="text-xs text-zinc-500">The requested problem could not be found in the archive.</p>
          <Link href="/problems" className="inline-flex text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline items-center gap-1 mt-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            Return to Archive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* ── Left Pane: Tabbed Problem Workspace ─────────────────────────── */}
      <div className="w-1/2 flex flex-col border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 min-w-0">
        {/* Left Header Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/40 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-zinc-500 shrink-0">
          {([
            { id: 'statement', label: 'Description' },
            { id: 'submissions', label: 'Submissions' },
            { id: 'hints', label: 'Hints' },
          ] as { id: typeof leftTab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setLeftTab(id)}
              className={cn(
                "relative px-3 py-1.5 rounded-md transition-colors text-xs",
                leftTab === id ? "text-blue-700 dark:text-blue-300" : "hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <span className="relative z-10">{label}</span>
              {leftTab === id && (
                <motion.div
                  layoutId="leftTabIndicator"
                  className="absolute inset-0 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-sm rounded-md -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {leftTab === 'statement' && <ProblemStatement problem={problem} />}

          {leftTab === 'submissions' && (
            <div className="p-6 text-xs text-zinc-500 space-y-4 font-inter">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[0.62rem]">
                Submission History
              </h3>
              <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 text-[0.6rem] uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Verdict</th>
                      <th className="py-3 px-4 font-semibold">Language</th>
                      <th className="py-3 px-4 font-semibold text-center">Runtime</th>
                      <th className="py-3 px-4 font-semibold text-center">Memory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-zinc-500 bg-zinc-50/30 dark:bg-zinc-950/30">
                        No submissions yet for this problem.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {leftTab === 'hints' && (
            <div className="p-6 text-xs space-y-4 font-inter">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[0.62rem]">
                Algorithmic Hints
              </h3>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-200 text-xs">
                  Target Complexity: <code className="bg-white dark:bg-blue-900/60 px-1.5 py-0.5 rounded font-mono text-[0.7rem] border border-blue-100 dark:border-blue-800">O(N log N)</code> or <code className="bg-white dark:bg-blue-900/60 px-1.5 py-0.5 rounded font-mono text-[0.7rem] border border-blue-100 dark:border-blue-800">O(N)</code>
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Consider using a hash map to store frequencies, or sort the array first. If using two pointers, ensure the array is sorted.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30">
                <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                  <strong>Tip:</strong> Start by writing a simple brute force solution. Once that works and passes the sample cases, try to optimize it.
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Pane: Editor + Verdict ─────────────────────────────────── */}
      <div className="flex w-1/2 flex-col bg-zinc-50 dark:bg-zinc-950 min-w-0">
        {/* Toolbar */}
        <div className="shrink-0">
          <EditorToolbar
            language={language}
            onLanguageChange={setLanguage}
            onReset={resetCode}
            onRun={() => submitCode(problemId, language, code, false)}
            onSubmit={() => submitCode(problemId, language, code, true)}
            isStreaming={isStreaming}
            lastSavedAt={lastSavedAt}
          />
        </div>

        {/* Monaco Editor — takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeEditor height="100%" />
        </div>

        {/* Resizable Verdict / Test Panel */}
        <div
          className="shrink-0 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col"
          style={{ height: `${bottomPanelHeight}px` }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              "h-1 w-full cursor-row-resize hover:bg-blue-500/30 transition-colors shrink-0",
              isResizing && "bg-blue-500/40"
            )}
          />

          {/* Panel header tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-100 dark:border-zinc-900 px-3 py-1.5 shrink-0">
            {(['testcases', 'custom'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setVerdictTab(tab)}
                className="relative px-3 py-1 text-xs font-semibold transition-colors"
              >
                <span className={cn("relative z-10", verdictTab === tab ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                  {tab === 'testcases' ? 'Test Results' : 'Custom Input'}
                </span>
                {verdictTab === tab && (
                  <motion.div
                    layoutId="verdictTabIndicator"
                    className="absolute bottom-[-7px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-500 rounded-t-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {verdictTab === 'custom' ? (
              <CustomInputPanel
                onRunCustomInput={handleRunCustomInput}
                isStreaming={isStreaming}
                customOutput={customOutput}
              />
            ) : verdict || isStreaming ? (
              <div className="space-y-3">
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
              <div className="text-center text-xs text-zinc-500 py-6">
                Press <strong className="text-zinc-700 dark:text-zinc-300">Run</strong>{' '}
                (<kbd className="font-mono text-[0.65rem] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">Ctrl+Enter</kbd>)
                {' '}to test, or{' '}
                <strong className="text-blue-600 dark:text-blue-400">Submit</strong>{' '}
                (<kbd className="font-mono text-[0.65rem] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">Ctrl+Shift+Enter</kbd>)
                {' '}to evaluate all test cases.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
