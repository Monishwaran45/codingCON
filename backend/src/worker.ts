import 'dotenv/config';
import { connectDB } from './db/database';
import { consumeJudgeJobs } from './queue/rabbitmq';
import { runCode } from './judge/runner';
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

// Use the canonical normaliser from the judge module
const normalise = normaliseOutput;

async function runJudge(job: JudgeJob): Promise<void> {
  const { publishSocketEvent } = await import('./queue/rabbitmq');
  const room = `submission:${job.submissionId}`;

  let passed = 0;
  let maxTime = 0;
  let maxMem = 0;
  let finalVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' = 'AC';
  let failedTc: null | {
    id: string; passed: false; expectedOutput: string; actualOutput: string;
    executionTimeMs: number; memoryKb: number; error?: string;
  } = null;

  const resultsToStore: ISubmissionResult[] = [];

  for (let i = 0; i < job.testCases.length; i++) {
    const tc = job.testCases[i];
    const result = await runCode(job.language, job.code, tc.input);

    let verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' = 'AC';
    if (result.timedOut || result.netTimeMs > job.timeLimitMs) verdict = 'TLE';
    else if (result.exitCode !== 0) verdict = 'RE';
    else if (normalise(result.stdout) !== normalise(tc.expectedOutput)) verdict = 'WA';

    const tcPassed = verdict === 'AC';
    if (tcPassed) passed++;
    maxTime = Math.max(maxTime, result.executionTimeMs);
    maxMem = Math.max(maxMem, result.memoryKb);

    resultsToStore.push({
      id: uuid(),
      testCaseId: tc.id,
      passed: tcPassed,
      actualOutput: result.stdout,
      executionTimeMs: result.executionTimeMs,
      memoryKb: result.memoryKb,
      error: result.stderr || null,
      sortOrder: i,
    });

    await publishSocketEvent(room, 'submission:progress', {
      submissionId: job.submissionId,
      passedTestCases: passed,
      totalTestCases: job.testCases.length,
      isStreaming: true,
      testCaseResult: {
        id: tc.id,
        passed: tcPassed,
        executionTimeMs: result.executionTimeMs,
        memoryKb: result.memoryKb,
        ...(tc.isSample ? { expectedOutput: tc.expectedOutput, actualOutput: result.stdout } : {}),
        ...(result.stderr ? { error: result.stderr } : {}),
      },
    });

    if (!tcPassed) {
      finalVerdict = verdict;
      if (!failedTc) {
        failedTc = {
          id: tc.id,
          passed: false,
          expectedOutput: tc.expectedOutput,
          actualOutput: result.stdout,
          executionTimeMs: result.executionTimeMs,
          memoryKb: result.memoryKb,
          ...(result.stderr ? { error: result.stderr } : {}),
        };
      }
      break;
    }
  }

  await Submission.findByIdAndUpdate(job.submissionId, {
    verdict: finalVerdict,
    passedTestCases: passed,
    executionTimeMs: maxTime,
    memoryKb: maxMem,
    testCaseResults: resultsToStore,
  });

  await Problem.findByIdAndUpdate(job.problemId, { $inc: { totalSubmissions: 1 } });

  if (finalVerdict === 'AC') {
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
  }

  await publishSocketEvent(room, 'submission:done', {
    submissionId: job.submissionId,
    verdict: finalVerdict,
    passedTestCases: passed,
    totalTestCases: job.testCases.length,
    executionTimeMs: maxTime,
    memoryKb: maxMem,
    failedTestCase: failedTc,
    isStreaming: false,
  });
}

async function startWorker() {
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
