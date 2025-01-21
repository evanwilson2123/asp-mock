import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IAthlete {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  u?: string;
  level: string;
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
}

const athleteSchema = new Schema<IAthlete>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  u: { type: String, required: false },
  level: { type: String, required: true },
  team: { type: mongoose.Types.ObjectId, ref: "Team", required: false },
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
});

const Athlete = models.Athlete || model<IAthlete>("Athlete", athleteSchema);

export default Athlete;
