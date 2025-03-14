import { Schema, model, models, Types } from 'mongoose';
import assesmentSectionSchema, { IAssessmentSection } from './assesmentSection';

export interface IGraphConfig {
  title: string;
  type: 'bar' | 'line' | 'pie';
  fieldIds: string[]; // Changed to string array
}

const graphConfigSchema = new Schema<IGraphConfig>({
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['bar', 'line', 'pie'] },
  fieldIds: [{ type: String, required: true }], // Changed from ObjectId to String
});

export interface IAssessmentTemplate {
  _id: Types.ObjectId;
  name: string;
  sections: IAssessmentSection[];
  desc?: string;
  graphs?: IGraphConfig[];
}

const assesmentTemplateSchema = new Schema<IAssessmentTemplate>(
  {
    name: { type: String, required: true },
    sections: { type: [assesmentSectionSchema], required: true },
    desc: { type: String, required: false },
    graphs: { type: [graphConfigSchema], required: false },
  },
  { timestamps: true }
);

const AssesmentTemplate =
  models.AssesmentTemplate ||
  model<IAssessmentTemplate>('AssesmentTemplate', assesmentTemplateSchema);

export default AssesmentTemplate;
