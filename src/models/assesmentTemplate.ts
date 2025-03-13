import { Schema, model, models, Types } from 'mongoose';
import assesmentFieldSchema, { IAssessmentField } from './assesmentField';

export interface IAssessmentTemplate {
  _id: Types.ObjectId;
  name: string;
  fields: IAssessmentField[];
  desc?: string;
}

const assesmentTemplateSchema = new Schema<IAssessmentTemplate>(
  {
    name: { type: String, required: true },
    fields: { type: [assesmentFieldSchema], required: true },
    desc: { type: String, required: false },
  },
  { timestamps: true }
);

// RESTART BITCH

const AssesmentTemplate =
  models.AssesmentTemplate ||
  model<IAssessmentTemplate>('AssesmentTemplate', assesmentTemplateSchema);

export default AssesmentTemplate;
