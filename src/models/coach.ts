import mongoose, { Schema, model, models, Types } from "mongoose";

export interface ICoach {
  _id: Types.ObjectId;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  teams?: Types.ObjectId[];
  photoUrl?: string;
}

const coachSchema = new Schema<ICoach>({
  clerkId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  teams: [{ type: mongoose.Types.ObjectId, ref: "Team" }],
  photoUrl: { type: String },
});

const Coach = models.Coach || model<ICoach>("Coach", coachSchema);

export default Coach;
