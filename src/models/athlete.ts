import mongoose, { Schema, model, models, Types } from 'mongoose';
import { coachNoteSchema, ICoachNote } from './coachesNote';

export interface IAthlete {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  u?: string;
  level: string;
  coachesNotes: ICoachNote[];
  team?: Types.ObjectId;
  age?: number;
  height?: string;
  weight?: string;
  active: boolean;
  season?: string;
  programType?: string;
  blastMotion: string[];
  hitTrax?: string[];
  trackman?: string[];
  armcare?: string[];
  forceplates?: string[];
  intended?: string[];
  pPhotoUrl?: string;
}

const athleteSchema = new Schema<IAthlete>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  u: { type: String, required: false },
  level: { type: String, required: true },
  coachesNotes: { type: [coachNoteSchema], default: [] },
  team: { type: mongoose.Types.ObjectId, ref: 'Team', required: false },
  age: { type: Number, required: false },
  height: { type: String, required: false },
  weight: { type: String, required: false },
  active: { type: Boolean, required: true, default: true },
  season: { type: String, required: false },
  programType: { type: String, required: false },
  blastMotion: [{ type: String, required: false }],
  hitTrax: [{ type: String, required: false }],
  trackman: [{ type: String, required: false }],
  armcare: [{ type: String, required: false }],
  forceplates: [{ type: String, required: false }],
  intended: [{ type: String, required: false }],
  pPhotoUrl: { type: String, required: false },
});

const Athlete = models.Athlete || model<IAthlete>('Athlete', athleteSchema);

export default Athlete;
