import { Schema, Types } from 'mongoose';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface IAssessmentField {
  _id?: Types.ObjectId;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  clientId?: string; // <-- NEW: ephemeral ID from the client
}

const assesmentFieldSchema = new Schema<IAssessmentField>({
  label: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['text', 'number', 'select', 'date', 'checkbox'],
  },
  required: { type: Boolean, required: true, default: false },
  options: { type: [String], required: false },
  clientId: { type: String, required: false }, // <-- NEW
});

export default assesmentFieldSchema;
