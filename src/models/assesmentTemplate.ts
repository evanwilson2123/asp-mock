import { Schema, model, models, Types } from 'mongoose';
import assesmentFieldSchema, { IAssessmentField } from './assesmentField';

export interface IAssessmentTemplate {
  _id: Types.ObjectId;
  name: string;
  fields: IAssessmentField[];
}

const assesmentTemplateSchema = new Schema<IAssessmentTemplate>(
  {
    name: { type: String, required: true },
    fields: { type: [assesmentFieldSchema], required: true },
  },
  { timestamps: true }
);

const AssesmentTemplate =
  models.AssesmentTemplate ||
  model<IAssessmentTemplate>('AssesmentTemplate', assesmentTemplateSchema);

export default AssesmentTemplate;
