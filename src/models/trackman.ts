import mongoose, { Schema, model, Types } from "mongoose";

export interface ITrackman {
  athlete?: Types.ObjectId; // Reference to the athlete
  pitchReleaseSpeed: number[]; // mph
  pitchType: string[];
  pitcherName: string[];
  releaseHeight: number[]; // ft
  releaseSide: number[]; // ft
  extension: number[]; // ft
  tilt: string[];
  measuredTilt?: string[];
  gyro?: number[]; // degrees
  spinEfficiency: number[]; // %
  inducedVerticalBreak: number[]; // inches
  horizontalBreak: number[]; // inches
  verticalApproachAngle: number[]; // degrees
  horizontalApproachAngle: number[]; // degrees
  locationHeight: number[]; // ft
  locationSide: number[]; // ft
  zoneLocation: string[];
  sessionId?: string;
  spinRate: number[]; // rpm
}

const trackmanSchema = new Schema<ITrackman>({
  athlete: { type: mongoose.Types.ObjectId, ref: "Athlete", required: true },
  pitchReleaseSpeed: { type: [Number], required: false },
  pitchType: { type: [String], required: false },
  pitcherName: { type: [String], required: false },
  releaseHeight: { type: [Number], required: false },
  releaseSide: { type: [Number], required: false },
  extension: { type: [Number], required: false },
  tilt: { type: [String], required: false },
  measuredTilt: { type: [String], required: false },
  gyro: { type: [Number], required: false },
  spinEfficiency: { type: [Number], required: false },
  inducedVerticalBreak: { type: [Number], required: false },
  horizontalBreak: { type: [Number], required: false },
  verticalApproachAngle: { type: [Number], required: false },
  horizontalApproachAngle: { type: [Number], required: false },
  locationHeight: { type: [Number], required: false },
  locationSide: { type: [Number], required: false },
  zoneLocation: { type: [String], required: false },
  sessionId: { type: String, required: false },
  spinRate: { type: [Number], required: false },
});

const Trackman =
  mongoose.models.Trackman || model<ITrackman>("Trackman", trackmanSchema);

export default Trackman;
