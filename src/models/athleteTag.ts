import { Schema, model, models, Types } from 'mongoose';

export type Tech =
  | 'blast'
  | 'hittrax'
  | 'trackman'
  | 'armcare'
  | 'forceplates'
  | 'assessment';

export interface IAthleteTag {
  _id: Types.ObjectId;
  // athleteIds: string[];
  tech?: Tech;
  name: string;
  description?: string;
  notes: string;
  links?: string[];
  automatic: boolean;
  session: boolean;
  sessionId?: string;
  metric?: string;
  min?: number;
  max?: number;
  greaterThan?: number;
  lessThan: number;
  media: string[];
}

const athleteTagSchema = new Schema<IAthleteTag>({
  // athleteIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'Athlete' }],
  tech: {
    type: String,
    required: false,
    enum: ['blast', 'hittrax', 'trackman', 'armcare', 'forceplates'],
  },
  name: { type: String, required: true },
  description: { type: String, required: false },
  notes: { type: String, required: true },
  links: [{ type: [String], required: false }],
  automatic: { type: Boolean, required: true },
  session: { type: Boolean, required: true },
  sessionId: { type: String, required: false },
  metric: { type: String, required: false },
  min: { type: Number, required: false },
  max: { type: Number, required: false },
  greaterThan: { type: Number, required: false },
  lessThan: { type: Number, required: false },
  media: { type: [String], required: false, default: [] },
});

const AthleteTag =
  models.AthleteTag || model<IAthleteTag>('AthleteTag', athleteTagSchema);

export default AthleteTag;
