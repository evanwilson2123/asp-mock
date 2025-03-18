import { Schema, model, models, Types } from 'mongoose';

export type Tech = 'blast' | 'hittrax' | 'trackman' | 'armcare' | 'forceplates';

export interface IAthleteTag {
  athleteId?: Types.ObjectId;
  tech: Tech;
  name: string;
  description?: string;
  notes: string;
  links?: string[];
}

const athleteTagSchema = new Schema<IAthleteTag>({
  athleteId: { type: Schema.Types.ObjectId, required: true, ref: 'Athlete' },
  tech: {
    type: String,
    required: true,
    enum: ['blast', 'hittrax', 'trackman', 'armcare', 'forceplates'],
  },
  name: { type: String, required: true },
  description: { type: String, required: false },
  notes: { type: String, required: true },
  links: [{ type: [String], required: false }],
});

const AthleteTag =
  models.AthleteTag || model<IAthleteTag>('AthleteTag', athleteTagSchema);

export default AthleteTag;
