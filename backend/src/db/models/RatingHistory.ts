import { Schema, model } from 'mongoose';

export interface IRatingHistory {
  _id: string;
  userId: string;
  rating: number;
  contestId?: string | null;
  recordedAt: Date;
}

const ratingHistorySchema = new Schema<IRatingHistory>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    rating: { type: Number, required: true },
    contestId: { type: String, default: null, ref: 'Contest' },
    recordedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const RatingHistory = model<IRatingHistory>('RatingHistory', ratingHistorySchema);
