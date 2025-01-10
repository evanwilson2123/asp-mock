import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IAthlete {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  team?: Types.ObjectId;
}

const athleteSchema = new Schema<IAthlete>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  level: { type: String, required: true },
  team: { type: mongoose.Types.ObjectId, ref: "Team", required: false },
});

const Athlete = models.Athlete || model<IAthlete>("Athlete", athleteSchema);

export default Athlete;
