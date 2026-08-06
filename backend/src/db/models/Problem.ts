import { Schema, model } from 'mongoose';

export interface ITestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  sortOrder: number;
}

export interface IProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  acceptanceRate: number;
  totalSubmissions: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
  tags: string[];
  isActive: boolean;
  createdBy?: string;
  testCases: ITestCase[];
  createdAt: Date;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    id: { type: String, required: true },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    isSample: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const problemSchema = new Schema<IProblem>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    points: { type: Number, default: 100 },
    timeLimitMs: { type: Number, default: 1000 },
    memoryLimitMb: { type: Number, default: 256 },
    acceptanceRate: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    description: { type: String, default: '' },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, ref: 'User' },
    testCases: [testCaseSchema],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const Problem = model<IProblem>('Problem', problemSchema);
