import { Schema, model } from 'mongoose';

export interface IAnnouncement {
  _id: string;
  contestId: string;
  message: string;
  createdBy?: string;
  timestamp: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    _id: { type: String, required: true },
    contestId: { type: String, required: true, ref: 'Contest', index: true },
    message: { type: String, required: true },
    createdBy: { type: String, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
