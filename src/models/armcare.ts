import mongoose, { Schema, model, Types } from "mongoose";

export interface IArmCare {
  // Basic athlete info
  examDate?: Date; // e.g. "01/13/2025" -> parse to Date if desired
  email?: string;
  armCareId?: string; // "ArmCare ID" if you use one
  lastName?: string;
  firstName?: string;
  gender?: string;
  dob?: Date; // e.g. "12/21/2007" -> parse to Date if desired
  heightFt?: number; // "Height (ft)"
  heightIn?: number; // "Height (in)"
  weightLbs?: number; // "Weight (lbs)"
  country?: string;
  stateProv?: string;
  position1?: string;
  position2?: string;
  position3?: string;
  position4?: string;
  position5?: string;
  playingLevel?: string;
  throws?: string; // e.g. "Right" / "Left"
  bats?: string; // e.g. "Right" / "Left" / "Switch"
  surgery?: string; // Any surgery info if provided

  // Exam / session details
  time?: string; // e.g. "6:38:07" (could also store as Date/DateTime)
  timezone?: string;
  examType?: string; // e.g. "Fresh - Quick"

  // ArmCare metrics
  armScore?: number;
  totalStrength?: number;

  // Internal rotation (throwing arm) fields
  irtarmStrength?: number; // "IRTARM Strength"
  irtarmRs?: number; // "IRTARM RS"
  irtarmRecovery?: string; // "Normal" / ?

  // External rotation (throwing arm) fields
  ertarmStrength?: number; // "ERTARM Strength"
  ertarmRs?: number; // "ERTARM RS"
  ertarmRecovery?: string;

  // Shoulder tilt (throwing arm) fields
  starmStrength?: number; // "STARM Strength"
  starmRs?: number; // "STARM RS"
  starmRecovery?: string;

  // Grip test (throwing arm) fields
  gtarmStrength?: number; // "GTARM Strength"
  gtarmRs?: number; // "GTARM RS"
  gtarmRecovery?: string;

  shoulderBalance?: number; // "Shoulder Balance"
  velo?: number; // "Velo"
  svr?: number; // "SVR"

  // Post-exam strength
  totalStrengthPost?: number;
  postStrengthLoss?: number;
  totalPctFresh?: number; // "Total %Fresh"

  irtarmPostStrength?: number;
  irtarmPostLoss?: number;
  irtarmPctFresh?: number; // "IRTARM %Fresh"

  ertarmPostStrength?: number;
  ertarmPostLoss?: number;
  ertarmPctFresh?: number; // "ERTARM %Fresh"

  starmPostStrength?: number;
  starmPostLoss?: number;
  starmPctFresh?: number; // "STARM %Fresh"

  gtarmPostStrength?: number;
  gtarmPostLoss?: number;
  gtarmPctFresh?: number; // "GTARM %Fresh"

  // Peak forces (1,2,3 attempts) - example for IRTARM
  irtarmPeakForceLbs1?: number;
  irtarmPeakForceLbs2?: number;
  irtarmPeakForceLbs3?: number;
  irtarmMaxLbs?: number;

  irntarmPeakForceLbs1?: number;
  irntarmPeakForceLbs2?: number;
  irntarmPeakForceLbs3?: number;
  irntarmMaxLbs?: number;

  ertarmPeakForceLbs1?: number;
  ertarmPeakForceLbs2?: number;
  ertarmPeakForceLbs3?: number;
  ertarmMaxLbs?: number;

  erntarmPeakForceLbs1?: number;
  erntarmPeakForceLbs2?: number;
  erntarmPeakForceLbs3?: number;
  erntarmMaxLbs?: number;

  starmPeakForceLbs1?: number;
  starmPeakForceLbs2?: number;
  starmPeakForceLbs3?: number;
  starmMaxLbs?: number;

  sntarmPeakForceLbs1?: number;
  sntarmPeakForceLbs2?: number;
  sntarmPeakForceLbs3?: number;
  sntarmMaxLbs?: number;

  gtarmPeakForceLbs1?: number;
  gtarmPeakForceLbs2?: number;
  gtarmPeakForceLbs3?: number;
  gtarmMaxLbs?: number;

  gntarmPeakForceLbs1?: number;
  gntarmPeakForceLbs2?: number;
  gntarmPeakForceLbs3?: number;
  gntarmMaxLbs?: number;

  accelPeakForceLbs1?: number;
  accelPeakForceLbs2?: number;
  accelPeakForceLbs3?: number;
  accelMaxLbs?: number;

  decelPeakForceLbs1?: number;
  decelPeakForceLbs2?: number;
  decelPeakForceLbs3?: number;
  decelMaxLbs?: number;

  totalPrimerMaxLbs?: number;

  // Range of motion (ROM) and related
  irtarmRom?: number;
  irntarmRom?: number;
  ertarmRom?: number;
  erntarmRom?: number;
  tarmTarc?: number;
  ntarmTarc?: number;
  ftarmRom?: number;
  fntarmRom?: number;

  // Fresh data
  freshLastOuting?: string; // e.g. "Yes" / "No"
  freshThrewToday?: string;
  freshRpe?: number;
  freshArmFeels?: string;
  freshLocation?: string;
  freshWarmedUp?: string;

  // Post data
  postThrewToday?: string;
  postThrowingActivity?: string;
  postThrowingTime?: string;
  postPitchCount?: number;
  postHighIntentThrows?: number;
  postRpe?: number;
}

// Create the Schema
const armCareSchema = new Schema<IArmCare>(
  {
    examDate: { type: Date, required: false },
    email: { type: String, required: false },
    armCareId: { type: String, required: false },
    lastName: { type: String, required: false },
    firstName: { type: String, required: false },
    gender: { type: String, required: false },
    dob: { type: Date, required: false },
    heightFt: { type: Number, required: false },
    heightIn: { type: Number, required: false },
    weightLbs: { type: Number, required: false },
    country: { type: String, required: false },
    stateProv: { type: String, required: false },
    position1: { type: String, required: false },
    position2: { type: String, required: false },
    position3: { type: String, required: false },
    position4: { type: String, required: false },
    position5: { type: String, required: false },
    playingLevel: { type: String, required: false },
    throws: { type: String, required: false },
    bats: { type: String, required: false },
    surgery: { type: String, required: false },

    time: { type: String, required: false },
    timezone: { type: String, required: false },
    examType: { type: String, required: false },

    armScore: { type: Number, required: false },
    totalStrength: { type: Number, required: false },

    irtarmStrength: { type: Number, required: false },
    irtarmRs: { type: Number, required: false },
    irtarmRecovery: { type: String, required: false },

    ertarmStrength: { type: Number, required: false },
    ertarmRs: { type: Number, required: false },
    ertarmRecovery: { type: String, required: false },

    starmStrength: { type: Number, required: false },
    starmRs: { type: Number, required: false },
    starmRecovery: { type: String, required: false },

    gtarmStrength: { type: Number, required: false },
    gtarmRs: { type: Number, required: false },
    gtarmRecovery: { type: String, required: false },

    shoulderBalance: { type: Number, required: false },
    velo: { type: Number, required: false },
    svr: { type: Number, required: false },

    totalStrengthPost: { type: Number, required: false },
    postStrengthLoss: { type: Number, required: false },
    totalPctFresh: { type: Number, required: false },

    irtarmPostStrength: { type: Number, required: false },
    irtarmPostLoss: { type: Number, required: false },
    irtarmPctFresh: { type: Number, required: false },

    ertarmPostStrength: { type: Number, required: false },
    ertarmPostLoss: { type: Number, required: false },
    ertarmPctFresh: { type: Number, required: false },

    starmPostStrength: { type: Number, required: false },
    starmPostLoss: { type: Number, required: false },
    starmPctFresh: { type: Number, required: false },

    gtarmPostStrength: { type: Number, required: false },
    gtarmPostLoss: { type: Number, required: false },
    gtarmPctFresh: { type: Number, required: false },

    irtarmPeakForceLbs1: { type: Number, required: false },
    irtarmPeakForceLbs2: { type: Number, required: false },
    irtarmPeakForceLbs3: { type: Number, required: false },
    irtarmMaxLbs: { type: Number, required: false },

    irntarmPeakForceLbs1: { type: Number, required: false },
    irntarmPeakForceLbs2: { type: Number, required: false },
    irntarmPeakForceLbs3: { type: Number, required: false },
    irntarmMaxLbs: { type: Number, required: false },

    ertarmPeakForceLbs1: { type: Number, required: false },
    ertarmPeakForceLbs2: { type: Number, required: false },
    ertarmPeakForceLbs3: { type: Number, required: false },
    ertarmMaxLbs: { type: Number, required: false },

    erntarmPeakForceLbs1: { type: Number, required: false },
    erntarmPeakForceLbs2: { type: Number, required: false },
    erntarmPeakForceLbs3: { type: Number, required: false },
    erntarmMaxLbs: { type: Number, required: false },

    starmPeakForceLbs1: { type: Number, required: false },
    starmPeakForceLbs2: { type: Number, required: false },
    starmPeakForceLbs3: { type: Number, required: false },
    starmMaxLbs: { type: Number, required: false },

    sntarmPeakForceLbs1: { type: Number, required: false },
    sntarmPeakForceLbs2: { type: Number, required: false },
    sntarmPeakForceLbs3: { type: Number, required: false },
    sntarmMaxLbs: { type: Number, required: false },

    gtarmPeakForceLbs1: { type: Number, required: false },
    gtarmPeakForceLbs2: { type: Number, required: false },
    gtarmPeakForceLbs3: { type: Number, required: false },
    gtarmMaxLbs: { type: Number, required: false },

    gntarmPeakForceLbs1: { type: Number, required: false },
    gntarmPeakForceLbs2: { type: Number, required: false },
    gntarmPeakForceLbs3: { type: Number, required: false },
    gntarmMaxLbs: { type: Number, required: false },

    accelPeakForceLbs1: { type: Number, required: false },
    accelPeakForceLbs2: { type: Number, required: false },
    accelPeakForceLbs3: { type: Number, required: false },
    accelMaxLbs: { type: Number, required: false },

    decelPeakForceLbs1: { type: Number, required: false },
    decelPeakForceLbs2: { type: Number, required: false },
    decelPeakForceLbs3: { type: Number, required: false },
    decelMaxLbs: { type: Number, required: false },

    totalPrimerMaxLbs: { type: Number, required: false },

    irtarmRom: { type: Number, required: false },
    irntarmRom: { type: Number, required: false },
    ertarmRom: { type: Number, required: false },
    erntarmRom: { type: Number, required: false },
    tarmTarc: { type: Number, required: false },
    ntarmTarc: { type: Number, required: false },
    ftarmRom: { type: Number, required: false },
    fntarmRom: { type: Number, required: false },

    freshLastOuting: { type: String, required: false },
    freshThrewToday: { type: String, required: false },
    freshRpe: { type: Number, required: false },
    freshArmFeels: { type: String, required: false },
    freshLocation: { type: String, required: false },
    freshWarmedUp: { type: String, required: false },

    postThrewToday: { type: String, required: false },
    postThrowingActivity: { type: String, required: false },
    postThrowingTime: { type: String, required: false },
    postPitchCount: { type: Number, required: false },
    postHighIntentThrows: { type: Number, required: false },
    postRpe: { type: Number, required: false },
  },
  {
    timestamps: true, // Optional: adds createdAt and updatedAt fields
  }
);

const ArmCare =
  mongoose.models.ArmCare || model<IArmCare>("ArmCare", armCareSchema);

export default ArmCare;
