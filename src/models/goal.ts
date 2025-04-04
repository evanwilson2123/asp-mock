// goal.ts
/**
 * This file is to define the Goal object in the Mongo Database,
 * this will allow athletes to track their progress in real time.
 *
 * 1. It will allow them to name the goal
 * 2. it will allow them to choose the metric to track
 * 3. it will ideally use aggregate data to keep a constant ongoing value either average or maximum
 * 4. show status of whether or not goal has been completed
 *
 */
import mongoose, { Schema, model, models, Types } from 'mongoose';

export interface IGoal {
  _id: Types.ObjectId;
  athlete?: Types.ObjectId;
  goalName: string;
  tech: string;
  metricToTrack: string;
  goalValue: number;
  currentValue: number;
  avgMax: string;
  sum: number;
  length: number;
  complete: boolean;
}

const goalSchema = new Schema<IGoal>({
  athlete: { type: mongoose.Types.ObjectId, ref: 'Athlete' },
  goalName: { type: String, required: true },
  tech: { type: String, required: true },
  metricToTrack: { type: String, required: true },
  goalValue: { type: Number, required: true },
  currentValue: { type: Number, required: false },
  avgMax: { type: String, required: false },
  sum: { type: Number, required: false },
  length: { type: Number, required: false },
  complete: { type: Boolean, required: true, default: false },
});

const Goal = models.Goal || model<IGoal>('Goal', goalSchema);

export default Goal;
