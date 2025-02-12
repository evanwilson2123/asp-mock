// coachesNote.ts
import { Schema, Types, model, models } from 'mongoose';

export interface ICoachNote {
  _id?: Types.ObjectId;
  coachName: string;
  coachNote: string;
  date: Date;
}

export const coachNoteSchema = new Schema<ICoachNote>({
  coachName: { type: String, required: true },
  coachNote: { type: String, required: true },
  date: { type: Date, required: true },
});

const CoachNote =
  models.CoachNote || model<ICoachNote>('CoachNote', coachNoteSchema);

export default CoachNote;
