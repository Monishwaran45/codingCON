/**
 * In-Memory Job Queue
 * Used for Render deployment where RabbitMQ is not available.
 * Processes judge jobs asynchronously using EventEmitter and single-compilation batch evaluation.
 */

import { EventEmitter } from 'events';
import { ISubmissionResult, Submission } from '../db/models/Submission';
import { Problem, ITestCase } from '../db/models/Problem';
import { User } from '../db/models/User';
import { Leaderboard, IProblemBreakdown } from '../db/models/Leaderboard';
import { executeTestSuite, TestCaseItem, TestCaseRunOutput } from '../judge/runner';
import { recalculateLeaderboard } from '../routes/leaderboard';
import { performanceConfig } from '../config/performance';
import { v4 as uuid } from 'uuid';

export interface JudgeJob {
  submissionId: string;
  userId: string;
  contestId: string | null;
  problemId: string;
  language: string;
  code: string;
  testCases: ITestCase[];
  timeLimitMs: number;
  isSubmit: boolean;
}

interface SocketEvent {
  room: string;
  eventName: string;
  data: any;
}

class InMemoryQueue extends EventEmitter {
  private queue: JudgeJob[] = [];
  private concurrency = performanceConfig.concurrency.maxJudgeJobs || 8;
  private activeJobs = 0;

  constructor() {
    super();
  }

  /**
   * Add a job to the queue
   */
  async addJob(job: JudgeJob): Promise<void> {
    console.log(`[Queue] Added job for submission: ${job.submissionId}`);
    this.queue.push(job);
    this.processNext();
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    if (this.activeJobs >= this.concurrency || this.queue.length === 0) {
      if (this.queue.length > 0) {
        console.log(`[Queue] Waiting for slot: ${this.activeJobs}/${this.concurrency} active, ${this.queue.length} queued`);
      }
      return;
    }

    this.activeJobs++;
    const job = this.queue.shift();

    if (!job) {
      this.activeJobs--;
      return;
    }

    try {
      console.log(`[Worker] Processing job: ${job.submissionId} (${this.activeJobs}/${this.concurrency})`);
      await this.runJudge(job);
    } catch (error) {
      console.error(`[Worker] Error processing job ${job.submissionId}:`, error);
      // Mark submission as error
      await Submission.findByIdAndUpdate(job.submissionId, {
        verdict: 'RE',
        passedTestCases: 0,
        executionTimeMs: 0,
        memoryKb: 0,
        testCaseResults: [],
      }).catch(err => console.error('Failed to update submission:', err));
    } finally {
      this.activeJobs--;
      console.log(`[Worker] Job completed, active: ${this.activeJobs}, queued: ${this.queue.length}`);
      // Process next job
      this.processNext();
    }
  }

  /**
   * Run judge on a submission using single-compilation batch evaluation
   */
  private async runJudge(job: JudgeJob): Promise<void> {
    const room = `submission:${job.submissionId}`;
    const resultsToStore: ISubmissionResult[] = [];

    const testCaseItems: TestCaseItem[] = job.testCases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: tc.isSample,
    }));

    // Real-time progress callback for WebSocket streaming
    const onProgress = (tcOutput: TestCaseRunOutput, passedCount: number, totalCount: number) => {
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

      this.emit('socketEvent', {
        room,
        eventName: 'submission:progress',
        data: {
          submissionId: job.submissionId,
          passedTestCases: passedCount,
          totalTestCases: totalCount,
          isStreaming: true,
          testCaseResult: {
            id: tcOutput.id,
            passed: tcOutput.passed,
            executionTimeMs: tcOutput.executionTimeMs,
            actualOutput: tcOutput.actualOutput,
            ...(tcOutput.isSample || !job.isSubmit ? { expectedOutput: tcOutput.expectedOutput } : {}),
            ...(tcOutput.error ? { error: tcOutput.error } : {}),
          },
        },
      } as SocketEvent);
    };

    const suiteResult = await executeTestSuite(
      job.language,
      job.code,
      testCaseItems,
      job.timeLimitMs,
      onProgress,
      true, // stop on first failure
    );

    // If compilation error occurred or no progress ran
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

    // Update submission with final results
    await Submission.findByIdAndUpdate(job.submissionId, {
      verdict: suiteResult.finalVerdict,
      passedTestCases: suiteResult.passedTestCases,
      executionTimeMs: suiteResult.maxExecutionTimeMs,
      memoryKb: suiteResult.maxMemoryKb,
      testCaseResults: resultsToStore,
    });

    await Problem.findByIdAndUpdate(job.problemId, { $inc: { totalSubmissions: 1 } });

    // Handle problem & user score updates if AC
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
          $inc: { solvedCount: 1, totalPoints: points },
        });
      }

      const totalSubmissions = await Submission.countDocuments({ problemId: job.problemId, isSubmit: true });
      const acceptedSubmissions = await Submission.countDocuments({ problemId: job.problemId, isSubmit: true, verdict: 'AC' });
      const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

      await Problem.findByIdAndUpdate(job.problemId, { acceptanceRate });
    }

    // Recalculate and push leaderboard if contest submission
    if (job.contestId && job.isSubmit) {
      await recalculateLeaderboard(job.contestId);

      const lbDocs = await Leaderboard.find({ contestId: job.contestId }).sort({
        totalScore: -1,
        penaltyTimeMinutes: 1,
      });

      this.emit('socketEvent', {
        room: `contest:${job.contestId}`,
        eventName: 'leaderboard:update',
        data: lbDocs.map((r, idx) => {
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
        }),
      } as SocketEvent);
    }

    console.log(`[Judge] Finished job: ${job.submissionId} - Verdict: ${suiteResult.finalVerdict}`);

    // Emit final socket event
    this.emit('socketEvent', {
      room,
      eventName: 'submission:done',
      data: {
        submissionId: job.submissionId,
        verdict: suiteResult.finalVerdict,
        passedTestCases: suiteResult.passedTestCases,
        totalTestCases: job.testCases.length,
        executionTimeMs: suiteResult.maxExecutionTimeMs,
        memoryKb: suiteResult.maxMemoryKb,
        failedTestCase: suiteResult.failedTestCase,
      },
    } as SocketEvent);
  }
}

export const inMemoryQueue = new InMemoryQueue();

