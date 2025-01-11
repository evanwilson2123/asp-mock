import mongoose, { Schema, model, models, Types } from "mongoose";

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  coach?: Types.ObjectId;
  assistants?: Types.ObjectId[];
  players: Types.ObjectId[];
  u?: string;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  coach: { type: mongoose.Types.ObjectId, ref: "Coach", reqired: true },
  assistants: [
    { type: mongoose.Types.ObjectId, ref: "Coach", required: false },
  ],
  players: [{ type: mongoose.Types.ObjectId, ref: "Athlete", required: true }],
  u: { type: String, required: false },
});

const Team = models.Team || model<ITeam>("Team", teamSchema);

export default Team;
