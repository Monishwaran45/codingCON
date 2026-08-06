import { Schema, model } from 'mongoose';

export interface IRole {
  name: string;
  permissions: string[];
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const Role = model<IRole>('Role', roleSchema);
