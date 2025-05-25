import { Schema, model, models, Types } from 'mongoose';

export interface ISectionResponse {
  title: string;
  responses: Map<string, any>;
  score?: number;
  maxScore?: number;
  passed?: boolean;
}

export interface IScore {
  sectionId: Types.ObjectId;
  score: number;
  maxScore: number;
  passed: boolean;
  details: {
    fieldId: string;
    value: number;
    score: number;
    maxScore: number;
  }[];
}

export interface IAssessment {
  title: string;
  athleteId: Types.ObjectId;
  templateId: Types.ObjectId;
  sections: ISectionResponse[];
  totalScore?: number;
  maxTotalScore?: number;
  passed?: boolean;
  scores?: IScore[];
}

const ScoreDetailSchema = new Schema({
  fieldId: { type: String, required: true },
  value: { type: Number, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true }
});

const ScoreSchema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  details: { type: [ScoreDetailSchema], required: true }
});

const SectionResponseSchema = new Schema<ISectionResponse>(
  {
    title: { type: String, required: true },
    responses: { type: Map, of: Schema.Types.Mixed, required: true },
    score: { type: Number, required: false },
    maxScore: { type: Number, required: false },
    passed: { type: Boolean, required: false }
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'AssesmentTemplate',
      required: true,
    },
    sections: { type: [SectionResponseSchema], required: true },
    totalScore: { type: Number, required: false },
    maxTotalScore: { type: Number, required: false },
    passed: { type: Boolean, required: false },
    scores: { type: [ScoreSchema], required: false }
  },
  { timestamps: true }
);

export default models.Assessment ||
  model<IAssessment>('Assessment', AssessmentSchema);
