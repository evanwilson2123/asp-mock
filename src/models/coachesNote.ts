// coachesNote.ts
import { Schema, model, models } from 'mongoose';

export interface ICoachNote {
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
