import { Schema, model } from 'mongoose';

export interface IContest {
  _id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  participantCount: number;
  maxScore: number;
  isLeaderboardFrozen: boolean;
  freezeTimeRemainingMinutes?: number | null;
  createdBy?: string;
  problemIds: string[];
  createdAt: Date;
}

const contestSchema = new Schema<IContest>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 120 },
    participantCount: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    isLeaderboardFrozen: { type: Boolean, default: false },
    freezeTimeRemainingMinutes: { type: Number, default: null },
    createdBy: { type: String, ref: 'User' },
    problemIds: [{ type: String, ref: 'Problem' }],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const Contest = model<IContest>('Contest', contestSchema);
