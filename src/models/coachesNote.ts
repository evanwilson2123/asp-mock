// coachesNote.ts
import { Schema, Types, model, models } from 'mongoose';

export interface ICoachNote {
  _id?: Types.ObjectId;
  coachName: string;
  coachNote: string;
  isAthlete?: boolean;
  date: Date;
}

export const coachNoteSchema = new Schema<ICoachNote>({
  coachName: { type: String, required: true },
  coachNote: { type: String, required: true },
  isAthlete: { type: Boolean, required: false, default: false },
  date: { type: Date, required: true },
});

const CoachNote =
  models.CoachNote || model<ICoachNote>('CoachNote', coachNoteSchema);

export default CoachNote;
