import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismaDb';

interface FormData {
  height: string;
  weight: number;
  age: number;
  primarySport: string;
  currentTrainingReg: string;
  goals: string;
  primaryPosition: string;
  hopeToGain: string;
  injuryHistory: string;
  coachingStyle: string;
  daysTraining: number;
  priorSC: boolean;

  // Mobility Assessment
  overHeadSquat: number;
  trunkStability: number;
  sidePlank: number;
  spinalFlexion: number;
  activeLegRaise: number;
  goodMorning: number;
  lungeOverhead: number;
  lateralTrunkTilt: number;

  // Hitting Mechanics Breakdown
  weighShift: number;
  torsoRot: number;
  pelvisLoad: number;
  forwardMove: number;
  hipShoulder: number;
  upperRot: number;
  lowerRot: number;
  frontArm: number;
  shoulderConn: number;
  barrelExt: number;
  batShoulderAng: number;

  // Pitching Mechanics Breakdown
  startingPos: number;
  legLiftInitWeightShift: number;
  engageGlute: number;
  pushBackLeg: number;
  vertShinAngViR: number;
  stayHeel: number;
  driveDirection: number;
  outDriveEarly: number;
  latVertGround: number;
  backKneeDrive: number;
  hipClear: number;
  rotDown: number;
  movesIndependent: number;
  excessiveRot: number;
  earlyTorsoRot: number;
  torsoNotSegment: number;
  bowFlexBow: number;
  scapularDig: number;
  reflexivePecFire: number;
  armSlotTorsoRot: number;
  rotPerpSpine: number;
  excessiveTilt: number;
  throwUpHill: number;
  armSwingCapMom: number;
  overlyPronOrSup: number;
  overlyFlexOrExtWrist: number;
  elbowInLine: number;
  lateEarlyFlipUp: number;
  elbowFlexionHundred: number;
  fullScapRetractAbduct: number;
  armDrag: number;
  limitedLayback: number;
  elbowPushForward: number;
  straightElbowNeutral: number;
  armWorksInd: number;
  earlySup: number;
  workOppGlove: number;
  retractAbductLanding: number;
  rotatesIntoPlane: number;
  leaks: number;
  frontFootContact: number;
  pawback: number;
  kneeStabTran: number;
  kneeStabFron: number;
  forearmPron: number;
  shoulderIntern: number;
  scapRelease: number;
  thoracicFlex: number;
  noViolentRecoil: number;
  overallTempo: number;
  overallRhythm: number;
  propTimedIntent: number;
  cervPos: number;
}

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json(
      { error: 'Missing athleteId from Request' },
      { status: 400 }
    );
  }
  try {
    const formData: FormData = await req.json();
    if (!formData) {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }
    await prisma.assessment.create({
      data: {
        athleteId,
        ...formData,
      },
    });
    return NextResponse.json({ message: 'Assesment Created' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error creating assesment: ${error}`);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
