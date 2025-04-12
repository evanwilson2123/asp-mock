// models/media.ts
import { Schema } from 'mongoose';

export interface IMedia {
  name: string;
  link: string;
  date: Date;
}

const mediaSchema = new Schema<IMedia>({
  name: { type: String, required: true },
  link: { type: String, required: true },
  date: { type: Date, required: true },
});

export default mediaSchema;
