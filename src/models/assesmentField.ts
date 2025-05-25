import { Schema, Types } from 'mongoose';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface IScoreRange {
  min: number;
  max: number;
  score: number;
}

export interface IAssessmentField {
  _id?: Types.ObjectId;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  clientId?: string; // <-- NEW: ephemeral ID from the client
  // New scoring fields
  isScored?: boolean;
  scoreRanges?: IScoreRange[];
  maxScore?: number;
  weight?: number; // For weighted scoring within a section
}

const scoreRangeSchema = new Schema<IScoreRange>({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  score: { type: Number, required: true }
});

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
  // New scoring fields
  isScored: { type: Boolean, default: false },
  scoreRanges: { type: [scoreRangeSchema], required: false },
  maxScore: { type: Number, required: false },
  weight: { type: Number, default: 1 }
});

export default assesmentFieldSchema;
