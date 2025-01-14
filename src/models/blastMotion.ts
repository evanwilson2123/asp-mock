import mongoose, { Schema, model, models } from "mongoose";

const BlastMotionSchema = new Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Athlete",
    required: true,
  },
  date: { type: Date, default: Date.now }, // Session creation date
  sessionName: { type: String, required: false }, // Optional session name
  equipment: { type: [String], required: false },
  handedness: { type: [String], required: false },
  swingDetails: { type: [String], required: false },
  planeScore: { type: [Number], required: false },
  connectionScore: { type: [Number], required: false },
  rotationScore: { type: [Number], required: false },
  batSpeed: { type: [Number], required: false },
  rotationalAcceleration: { type: [Number], required: false },
  onPlaneEfficiency: { type: [Number], required: false },
  attackAngle: { type: [Number], required: false },
  earlyConnection: { type: [Number], required: false },
  connectionAtImpact: { type: [Number], required: false },
  verticalBatAngle: { type: [Number], required: false },
  power: { type: [Number], required: false },
  timeToContact: { type: [Number], required: false },
  peakHandSpeed: { type: [Number], required: false },
});

const BlastMotion =
  models.BlastMotion || model("BlastMotion", BlastMotionSchema);

export default BlastMotion;
