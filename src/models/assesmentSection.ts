import { Schema, Types } from 'mongoose';
import assesmentFieldSchema, { IAssessmentField } from './assesmentField';

export interface IAssessmentSection {
  _id?: Types.ObjectId;
  title: string;
  // Each section now has its own array of fields.
  fields: IAssessmentField[];
  // New scoring fields
  isScored?: boolean;
  maxScore?: number;
  weight?: number; // For weighted scoring across sections
  passingScore?: number; // Optional passing threshold
}

const assesmentSectionSchema = new Schema<IAssessmentSection>({
  title: { type: String, required: true },
  fields: { type: [assesmentFieldSchema], required: true },
  // New scoring fields
  isScored: { type: Boolean, default: false },
  maxScore: { type: Number, required: false },
  weight: { type: Number, default: 1 },
  passingScore: { type: Number, required: false }
});

export default assesmentSectionSchema;
