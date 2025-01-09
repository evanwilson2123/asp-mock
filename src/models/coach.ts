import mongoose, { Schema, model, models, Types } from "mongoose";

export interface ICoach {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  teams?: Types.ObjectId[];
}

const coachSchema = new Schema<ICoach>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  teams: [{ type: mongoose.Types.ObjectId, ref: "Team" }],
});

const Coach = models.Coach || model<ICoach>("Coach", coachSchema);

export default Coach;
