import mongoose, { Schema, model, models, Types } from 'mongoose';
import { coachNoteSchema, ICoachNote } from './coachesNote';
import mediaSchema from './media';
export interface IAthlete {
  _id: Types.ObjectId;
  clerkId: string;
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
  blastTags: Types.ObjectId[];
  hitTags: Types.ObjectId[];
  trackTags: Types.ObjectId[];
  armTags: Types.ObjectId[];
  forceTags: Types.ObjectId[];
  assessmentTags: Types.ObjectId[];
  images: { name: string; link: string; date: Date }[];
  videos: { name: string; link: string; date: Date }[];
}

const athleteSchema = new Schema<IAthlete>({
  clerkId: { type: String, required: false },
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
  blastTags: [
    { type: mongoose.Types.ObjectId, ref: 'AthleteTag', required: false },
  ],
  hitTags: [
    { type: mongoose.Types.ObjectId, ref: 'AthleteTag', required: false },
  ],
  trackTags: [
    { type: mongoose.Types.ObjectId, ref: 'AthleteTag', required: false },
  ],
  armTags: [
    { type: mongoose.Types.ObjectId, ref: 'AthleteTag', required: false },
  ],
  forceTags: [
    { type: mongoose.Types.ObjectId, ref: 'AthleteTag', required: false },
  ],
  assessmentTags: [
    { type: mongoose.Types.ObjectId, ref: 'Assessment', required: false },
  ],
  images: { type: [mediaSchema], default: [] },
  videos: { type: [mediaSchema], default: [] },
});

const Athlete = models.Athlete || model<IAthlete>('Athlete', athleteSchema);

export default Athlete;
