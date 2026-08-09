import 'dotenv/config';
import { connectDB } from './db/database';
import { consumeJudgeJobs } from './queue/rabbitmq';
import { runCode, verifyDockerEngine } from './judge/runner';
import { normaliseOutput } from './judge/normalise';
import { v4 as uuid } from 'uuid';
import { Submission, ISubmissionResult } from './db/models/Submission';
import { Problem, ITestCase } from './db/models/Problem';
import { User } from './db/models/User';
import { Leaderboard, IProblemBreakdown } from './db/models/Leaderboard';
import { recalculateLeaderboard } from './routes/leaderboard';

interface JudgeJob {
  submissionId: string; userId: string; contestId: string | null;
  problemId: string; language: string; code: string;
  testCases: ITestCase[]; timeLimitMs: number; isSubmit: boolean;
}

import { executeTestSuite, TestCaseItem, TestCaseRunOutput } from './judge/runner';

async function runJudge(job: JudgeJob): Promise<void> {
  const { publishSocketEvent } = await import('./queue/rabbitmq');
  const room = `submission:${job.submissionId}`;
  const resultsToStore: ISubmissionResult[] = [];

  const testCaseItems: TestCaseItem[] = job.testCases.map((tc) => ({
    id: tc.id,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isSample: tc.isSample,
  }));

  const onProgress = async (tcOutput: TestCaseRunOutput, passedCount: number, totalCount: number) => {
    resultsToStore.push({
      id: uuid(),
      testCaseId: tcOutput.id,
      passed: tcOutput.passed,
      actualOutput: tcOutput.actualOutput,
      executionTimeMs: tcOutput.executionTimeMs,
      memoryKb: tcOutput.memoryKb,
      error: tcOutput.error || null,
      sortOrder: resultsToStore.length,
    });

    await publishSocketEvent(room, 'submission:progress', {
      submissionId: job.submissionId,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      isStreaming: true,
      testCaseResult: {
        id: tcOutput.id,
        passed: tcOutput.passed,
        executionTimeMs: tcOutput.executionTimeMs,
        memoryKb: tcOutput.memoryKb,
        ...(tcOutput.isSample ? { expectedOutput: tcOutput.expectedOutput, actualOutput: tcOutput.actualOutput } : {}),
        ...(tcOutput.error ? { error: tcOutput.error } : {}),
      },
    });
  };

  const suiteResult = await executeTestSuite(
    job.language,
    job.code,
    testCaseItems,
    job.timeLimitMs,
    onProgress,
    true,
  );

  if (resultsToStore.length === 0 && suiteResult.results.length > 0) {
    suiteResult.results.forEach((r, idx) => {
      resultsToStore.push({
        id: uuid(),
        testCaseId: r.id,
        passed: r.passed,
        actualOutput: r.actualOutput,
        executionTimeMs: r.executionTimeMs,
        memoryKb: r.memoryKb,
        error: r.error || null,
        sortOrder: idx,
      });
    });
  }

  await Submission.findByIdAndUpdate(job.submissionId, {
    verdict: suiteResult.finalVerdict,
    passedTestCases: suiteResult.passedTestCases,
    executionTimeMs: suiteResult.maxExecutionTimeMs,
    memoryKb: suiteResult.maxMemoryKb,
    testCaseResults: resultsToStore,
  });

  await Problem.findByIdAndUpdate(job.problemId, { $inc: { totalSubmissions: 1 } });

  if (suiteResult.finalVerdict === 'AC' && job.isSubmit) {
    const alreadySolved = await Submission.findOne({
      userId: job.userId,
      problemId: job.problemId,
      verdict: 'AC',
      _id: { $ne: job.submissionId },
    });

    if (!alreadySolved) {
      const problem = await Problem.findById(job.problemId).select('points');
      const points = problem?.points || 0;
      await User.findByIdAndUpdate(job.userId, { 
        $inc: { solvedCount: 1, totalPoints: points } 
      });
    }

    const totalSubmissions = await Submission.countDocuments({ problemId: job.problemId, isSubmit: true });
    const acceptedSubmissions = await Submission.countDocuments({ problemId: job.problemId, isSubmit: true, verdict: 'AC' });
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    await Problem.findByIdAndUpdate(job.problemId, { acceptanceRate });
  }

  if (job.contestId && job.isSubmit) {
    await recalculateLeaderboard(job.contestId);

    const lbDocs = await Leaderboard.find({ contestId: job.contestId }).sort({
      totalScore: -1,
      penaltyTimeMinutes: 1,
    });

    await publishSocketEvent(`contest:${job.contestId}`, 'leaderboard:update', 
      lbDocs.map((r, idx) => {
        const breakdownObj: Record<string, IProblemBreakdown> = {};
        if (r.problemBreakdown instanceof Map) {
          r.problemBreakdown.forEach((val, key) => { breakdownObj[key] = val; });
        } else if (r.problemBreakdown && typeof r.problemBreakdown === 'object') {
          Object.assign(breakdownObj, r.problemBreakdown);
        }
        return {
          rank: idx + 1,
          userId: r.userId,
          username: r.username,
          solvedCount: r.solvedCount,
          totalScore: r.totalScore,
          penaltyTimeMinutes: r.penaltyTimeMinutes,
          problemBreakdown: breakdownObj,
        };
      })
    );
  }

  await publishSocketEvent(room, 'submission:done', {
    submissionId: job.submissionId,
    verdict: suiteResult.finalVerdict,
    passedTestCases: suiteResult.passedTestCases,
    totalTestCases: job.testCases.length,
    executionTimeMs: suiteResult.maxExecutionTimeMs,
    memoryKb: suiteResult.maxMemoryKb,
    failedTestCase: suiteResult.failedTestCase,
    isStreaming: false,
  });
}

async function startWorker() {
  await verifyDockerEngine();
  await connectDB();
  console.log('✓ Worker connected to MongoDB');
  
  await consumeJudgeJobs(async (job) => {
    console.log(`[Worker] Received job for submission: ${job.submissionId}`);
    await runJudge(job);
    console.log(`[Worker] Finished job: ${job.submissionId}`);
  });
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
