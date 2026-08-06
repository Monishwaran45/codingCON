import { Schema, model, Document } from 'mongoose';

export interface IProblemBreakdown {
  score: number;
  attempted: boolean;
  solvedTime?: string;
}

export interface ILeaderboard extends Document {
  contestId: string;
  userId: string;
  username: string;
  solvedCount: number;
  totalScore: number;
  penaltyTimeMinutes: number;
  problemBreakdown: Map<string, IProblemBreakdown>;
  lastUpdated: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    contestId: { type: String, required: true, ref: 'Contest' },
    userId: { type: String, required: true, ref: 'User' },
    username: { type: String, required: true },
    solvedCount: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    penaltyTimeMinutes: { type: Number, default: 0 },
    problemBreakdown: {
      type: Map,
      of: new Schema<IProblemBreakdown>(
        {
          score: { type: Number, default: 0 },
          attempted: { type: Boolean, default: false },
          solvedTime: { type: String },
        },
        { _id: false },
      ),
      default: {},
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// Compound unique index on (contestId, userId)
leaderboardSchema.index({ contestId: 1, userId: 1 }, { unique: true });

export const Leaderboard = model<ILeaderboard>('Leaderboard', leaderboardSchema);
