import { Schema, model } from 'mongoose';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  totalPoints: number;
  streakDays: number;
  solvedCount: number;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      default: 'student',
    },
    totalPoints: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    solvedCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const User = model<IUser>('User', userSchema);
