import mongoose, { Schema, model, models, Types } from 'mongoose';

export type Level = 'Youth' | 'High School' | 'College' | 'Pro' | 'all';

export interface IGroup {
  _id: Types.ObjectId;
  name: string;
  headCoach: Types.ObjectId[];
  assistants?: Types.ObjectId[];
  athletes: Types.ObjectId[];
  level: Level;
}

const groupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  headCoach: [{ type: mongoose.Types.ObjectId, ref: 'Coach', required: true }],
  assistants: [
    { type: mongoose.Types.ObjectId, ref: 'Coach', required: false },
  ],
  athletes: [{ type: mongoose.Types.ObjectId, ref: 'Athlete', required: true }],
  level: {
    type: String,
    required: true,
    enum: ['Youth', 'High School', 'College', 'Pro', 'all'],
  },
});

const Group = models.Group || model<IGroup>('Group', groupSchema);

export default Group;
