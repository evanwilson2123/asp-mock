import { Schema, model, models, Types } from 'mongoose';
import assesmentSectionSchema, { IAssessmentSection } from './assesmentSection';

export interface IAssessmentTemplate {
  _id: Types.ObjectId;
  name: string;
  // Change "fields" to "sections"
  sections: IAssessmentSection[];
  desc?: string;
}

const assesmentTemplateSchema = new Schema<IAssessmentTemplate>(
  {
    name: { type: String, required: true },
    sections: { type: [assesmentSectionSchema], required: true },
    desc: { type: String, required: false },
  },
  { timestamps: true }
);

const AssesmentTemplate =
  models.AssesmentTemplate ||
  model<IAssessmentTemplate>('AssesmentTemplate', assesmentTemplateSchema);

export default AssesmentTemplate;
