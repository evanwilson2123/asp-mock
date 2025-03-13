import { Schema, model, models, Types } from 'mongoose';

export interface ISectionResponse {
  title: string;
  responses: Map<string, any>;
}

const SectionResponseSchema = new Schema<ISectionResponse>(
  {
    title: { type: String, required: true },
    responses: { type: Map, of: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

export interface IAssessment {
  title: string; // <-- New title field
  athleteId: Types.ObjectId;
  templateId: Types.ObjectId;
  sections: ISectionResponse[];
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true }, // Add the title here
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
  },
  { timestamps: true }
);

export default models.Assessment ||
  model<IAssessment>('Assessment', AssessmentSchema);
