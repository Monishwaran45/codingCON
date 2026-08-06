import { Schema, model } from 'mongoose';

export interface ISubmissionResult {
  id: string;
  testCaseId: string;
  passed: boolean;
  actualOutput?: string | null;
  executionTimeMs?: number | null;
  memoryKb?: number | null;
  error?: string | null;
  sortOrder: number;
}

export interface ISubmission {
  _id: string;
  problemId: string;
  userId: string;
  contestId?: string | null;
  language: string;
  code: string;
  verdict: 'pending' | 'running' | 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE';
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryKb: number;
  isSubmit: boolean;
  testCaseResults: ISubmissionResult[];
  createdAt: Date;
}

const submissionResultSchema = new Schema<ISubmissionResult>(
  {
    id: { type: String, required: true },
    testCaseId: { type: String, required: true },
    passed: { type: Boolean, default: false },
    actualOutput: { type: String, default: null },
    executionTimeMs: { type: Number, default: null },
    memoryKb: { type: Number, default: null },
    error: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const submissionSchema = new Schema<ISubmission>(
  {
    _id: { type: String, required: true },
    problemId: { type: String, required: true, ref: 'Problem', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    contestId: { type: String, default: null, ref: 'Contest', index: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    verdict: {
      type: String,
      enum: ['pending', 'running', 'AC', 'WA', 'TLE', 'MLE', 'RE'],
      default: 'pending',
    },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    isSubmit: { type: Boolean, default: false },
    testCaseResults: [submissionResultSchema],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const Submission = model<ISubmission>('Submission', submissionSchema);
