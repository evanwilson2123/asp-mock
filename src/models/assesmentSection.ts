import { Schema, Types } from 'mongoose';
import assesmentFieldSchema, { IAssessmentField } from './assesmentField';

export interface IAssessmentSection {
  _id?: Types.ObjectId;
  title: string;
  // Each section now has its own array of fields.
  fields: IAssessmentField[];
}

const assesmentSectionSchema = new Schema<IAssessmentSection>({
  title: { type: String, required: true },
  fields: { type: [assesmentFieldSchema], required: true },
});

export default assesmentSectionSchema;
