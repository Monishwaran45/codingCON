/**
 * In-Memory Job Queue
 * Used for Render deployment where RabbitMQ is not available
 * Processes judge jobs asynchronously using EventEmitter
 */

import { EventEmitter } from 'events';
import { ISubmissionResult, Submission } from '../db/models/Submission';
import { Problem, ITestCase } from '../db/models/Problem';
import { runCode } from '../judge/runner';
import { normaliseOutput } from '../judge/normalise';
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
  private processing = false;
  private concurrency = 4;
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
   * Run judge on a submission
   */
  private async runJudge(job: JudgeJob): Promise<void> {
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

      try {
        const result = await runCode(job.language, job.code, tc.input);

        let verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' = 'AC';
        if (result.timedOut || result.netTimeMs > job.timeLimitMs) verdict = 'TLE';
        else if (result.exitCode !== 0) verdict = 'RE';
        else if (normaliseOutput(result.stdout) !== normaliseOutput(tc.expectedOutput)) verdict = 'WA';

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

        // Emit socket event for real-time update
        this.emit('socketEvent', {
          room,
          eventName: 'submission:progress',
          data: {
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
          },
        } as SocketEvent);

        console.log(`[Judge] Test case ${tc.id}: ${tcPassed ? 'PASSED' : 'FAILED'} (${passed}/${job.testCases.length})`);
        console.log(`[Judge] Emitted socketEvent to room: ${room}`);

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
      } catch (error) {
        console.error(`[Worker] Error running test case ${tc.id}:`, error);
        finalVerdict = 'RE';
        resultsToStore.push({
          id: uuid(),
          testCaseId: tc.id,
          passed: false,
          actualOutput: '',
          executionTimeMs: 0,
          memoryKb: 0,
          error: String(error),
          sortOrder: i,
        });
        break;
      }
    }

    // Update submission with final results
    await Submission.findByIdAndUpdate(job.submissionId, {
      verdict: finalVerdict,
      passedTestCases: passed,
      executionTimeMs: maxTime,
      memoryKb: maxMem,
      testCaseResults: resultsToStore,
    });

    console.log(`[Judge] Finished job: ${job.submissionId} - Verdict: ${finalVerdict}`);

    // Emit final socket event (includes failedTestCase for the DiffViewer)
    this.emit('socketEvent', {
      room,
      eventName: 'submission:done',
      data: {
        submissionId: job.submissionId,
        verdict: finalVerdict,
        passedTestCases: passed,
        totalTestCases: job.testCases.length,
        executionTimeMs: maxTime,
        memoryKb: maxMem,
        failedTestCase: failedTc,
      },
    } as SocketEvent);

    console.log(`[Judge] Emitted final socketEvent to room: ${room}`);
  }
}

export const inMemoryQueue = new InMemoryQueue();

