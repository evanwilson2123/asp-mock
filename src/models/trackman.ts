import mongoose, { Schema, model, Types } from "mongoose";

export interface ITrackman {
  athlete?: Types.ObjectId; // Reference to the athlete
  pitchReleaseSpeed: number; // mph
  pitchType: string;
  pitcherName: string;
  releaseHeight: number; // ft
  releaseSide: number; // ft
  extension: number; // ft
  tilt: string;
  measuredTilt?: string;
  gyro?: number; // degrees
  spinEfficiency: number; // %
  inducedVerticalBreak: number; // inches
  horizontalBreak: number; // inches
  verticalApproachAngle: number; // degrees
  horizontalApproachAngle: number; // degrees
  locationHeight: number; // ft
  locationSide: number; // ft
  zoneLocation: string;
  sessionId?: string;
  spinRate: number; // rpm
}

const trackmanSchema = new Schema<ITrackman>({
  athlete: { type: mongoose.Types.ObjectId, ref: "Athlete", required: true },
  pitchReleaseSpeed: { type: Number, required: true },
  pitchType: { type: String, required: true },
  pitcherName: { type: String, required: true },
  releaseHeight: { type: Number, required: true },
  releaseSide: { type: Number, required: true },
  extension: { type: Number, required: true },
  tilt: { type: String, required: true },
  measuredTilt: { type: String },
  gyro: { type: Number },
  spinEfficiency: { type: Number, required: true },
  inducedVerticalBreak: { type: Number, required: true },
  horizontalBreak: { type: Number, required: true },
  verticalApproachAngle: { type: Number, required: true },
  horizontalApproachAngle: { type: Number, required: true },
  locationHeight: { type: Number, required: true },
  locationSide: { type: Number, required: true },
  zoneLocation: { type: String, required: true },
  sessionId: { type: String },
  spinRate: { type: Number, required: true },
});

const Trackman = model<ITrackman>("Trackman", trackmanSchema);

export default Trackman;
