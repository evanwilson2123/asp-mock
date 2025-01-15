import mongoose, { Schema, model, Types } from "mongoose";

export interface IHitTrax {
  athlete?: Types.ObjectId; // Reference to the athlete (required)
  AB: number[];
  date: string[];
  timestamp: string[];
  pitch: number[]; // numeric array in schema
  strikeZone: string[];
  pType: string[];
  velo: number[];
  LA: number[];
  dist: number[];
  res: string[];
  type: string[];
  horizAngle: number[]; // numeric array in schema
  pts: number[];
  strikeZoneBottom: number[];
  strikeZoneTop: number[];
  strikeZoneWidth: number[];
  verticalDistance: number[];
  horizontalDistance: number[];
  POIX: number[];
  POIY: number[];
  POIZ: number[];
  sprayChartX: number[];
  sprayChartZ: number[];
  fieldedX: number[];
  fieldedZ: number[];
  batMaterial: string[];
  user: string[];
  pitchAngle: number[];
  batting: string[]; // string array in schema
  level: string[];
  opposingPlayer: string[];
  tag: string[];
}

const hitTraxSchema = new Schema<IHitTrax>({
  athlete: { type: mongoose.Types.ObjectId, ref: "Athlete", required: true },
  AB: [Number],
  date: [String],
  timestamp: [String],
  pitch: [Number], // must receive numbers, not strings
  strikeZone: [String],
  pType: [String],
  velo: [Number],
  LA: [Number],
  dist: [Number],
  res: [String],
  type: [String],
  horizAngle: [Number], // must receive numbers
  pts: [Number],
  strikeZoneBottom: [Number],
  strikeZoneTop: [Number],
  strikeZoneWidth: [Number],
  verticalDistance: [Number],
  horizontalDistance: [Number],
  POIX: [Number],
  POIY: [Number],
  POIZ: [Number],
  sprayChartX: [Number],
  sprayChartZ: [Number],
  fieldedX: [Number],
  fieldedZ: [Number],
  batMaterial: [String],
  user: [String],
  pitchAngle: [Number],
  batting: [String], // must receive strings, not numbers
  level: [String],
  opposingPlayer: [String],
  tag: [String],
});

const HitTrax =
  mongoose.models.HitTrax || model<IHitTrax>("HitTrax", hitTraxSchema);

export default HitTrax;
