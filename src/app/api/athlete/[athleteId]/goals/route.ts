import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import Goal from '@/models/goal';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json(
      { message: 'Missing athlete ID in request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const goals = await Goal.find({ athlete: athleteId });

    console.log(goals);
    return NextResponse.json({ goals: goals || [] }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId');
    return NextResponse.json({ error: 'Missing athlete ID' }, { status: 400 });
  }
  try {
    await connectDB();
    const { goalName, tech, metricToTrack, goalValue } = await req.json();
    if (!goalName || !metricToTrack || goalValue == null || !tech) {
      console.log(
        `goalName: ${goalName}\nmetricToTrack: ${metricToTrack}\ngoalValue: ${goalValue}\ntech: ${tech}`
      );
      return NextResponse.json({ error: 'Missing field' }, { status: 400 });
    }
    const current = await calculateCurrent(
      tech,
      metricToTrack,
      'max',
      athleteId
    );
    const goal = new Goal({
      athlete: athleteId,
      goalName: goalName,
      tech,
      metricToTrack,
      goalValue,
      currentValue: current,
    });

    await goal.save();
    return NextResponse.json({ goal }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function calculateCurrent(
  tech: string,
  metric: string,
  avgMax: string,
  athleteId: string
): Promise<number> {
  switch (tech) {
    case 'Blast Motion':
      const blastSwings = await prisma.blastMotion.findMany({
        where: {
          athlete: athleteId,
        },
      });
      if (blastSwings.length === 0) {
        return 0;
      }
      const blastCurrent = calculateCurrentBlast(metric, avgMax, blastSwings);
      return blastCurrent;
    case 'Hittrax':
      const hitSwings = await prisma.hitTrax.findMany({
        where: {
          athlete: athleteId,
        },
      });
      if (hitSwings.length === 0) {
        return 0;
      }
      const hitCurrent = calculateCurrentHitTrax(metric, avgMax, hitSwings);
      return hitCurrent;
    case 'Track Man':
      const trackPitches = await prisma.trackman.findMany({
        where: {
          athleteId: athleteId,
        },
      });
      if (trackPitches.length === 0) {
        return 0;
      }
      const trackCurrent = calculateCurrentTrack(metric, avgMax, trackPitches);
      return trackCurrent;
    case 'Intended Zone':
      const intendedPitches = await prisma.intended.findMany({
        where: {
          athleteId: athleteId,
        },
      });
      if (intendedPitches.length === 0) {
        return 0;
      }
      const intendedCurrent = calculateCurrentIntended(
        metric,
        avgMax,
        intendedPitches
      );
      return intendedCurrent;
    default:
      return 0;
  }
}

function calculateCurrentBlast(
  metric: string,
  avgMax: string,
  swings: any[]
): number {
  switch (metric) {
    case 'Plane Score':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.planeScore ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(...swings.map((swing: any) => swing.planeScore ?? 0));
      }
    case 'Connection Score':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.connectionScore ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.connectionScore ?? 0)
        );
      }
    case 'Rotation Score':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.rotationScore ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.rotationScore ?? 0)
        );
      }
    case 'Bat Speed':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.batSpeed ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(...swings.map((swing: any) => swing.batSpeed ?? 0));
      }
    case 'Rotational Acceleration':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) =>
            acc + (swing.rotationalAcceleration ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.rotationalAcceleration ?? 0)
        );
      }
    case 'On Plane Efficiency':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.onPlaneEfficiency ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.onPlaneEfficiency ?? 0)
        );
      }
    case 'Attack Angle':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.attackAngle ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(...swings.map((swing: any) => swing.attackAngle ?? 0));
      }
    case 'Early Connection':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.earlyConnection ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.earlyConnection ?? 0)
        );
      }
    case 'Connection At Impact':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.connectionAtImpact ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.connectionAtImpact ?? 0)
        );
      }
    case 'Vertical Bat Angle':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.verticalBatAngle ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.verticalBatAngle ?? 0)
        );
      }
    case 'Power':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.power ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(...swings.map((swing: any) => swing.power ?? 0));
      }
    case 'Time To Contact':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.timeToContact ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.timeToContact ?? 0)
        );
      }
    case 'Peak Hand Speed':
      if (avgMax === 'avg') {
        const sum = swings.reduce(
          (acc: number, swing: any) => acc + (swing.peakHandSpeed ?? 0),
          0
        );
        return sum / swings.length;
      } else {
        return Math.max(
          ...swings.map((swing: any) => swing.peakHandSpeed ?? 0)
        );
      }
    default:
      return 0;
  }
}

function calculateCurrentHitTrax(
  metric: string,
  avgMax: string,
  records: any[]
): number {
  switch (metric) {
    case 'Exit Velocity':
      if (avgMax === 'avg') {
        const sum = records.reduce((acc, rec) => acc + (rec.velo ?? 0), 0);
        return sum / records.length;
      } else {
        return Math.max(...records.map((rec) => rec.velo ?? 0));
      }
    case 'Launch Angle':
      if (avgMax === 'avg') {
        const sum = records.reduce((acc, rec) => acc + (rec.LA ?? 0), 0);
        return sum / records.length;
      } else {
        return Math.max(...records.map((rec) => rec.LA ?? 0));
      }
    case 'Distance':
      if (avgMax === 'avg') {
        const sum = records.reduce((acc, rec) => acc + (rec.dist ?? 0), 0);
        return sum / records.length;
      } else {
        return Math.max(...records.map((rec) => rec.dist ?? 0));
      }
    default:
      return 0;
  }
}

function calculateCurrentTrack(
  metric: string,
  avgMax: string,
  records: any[]
): number {
  if (records.length === 0) return 0;

  switch (metric) {
    case 'Pitch Release Speed': {
      if (avgMax === 'avg') {
        const sum = records.reduce(
          (acc: number, rec: any) => acc + (rec.pitchReleaseSpeed ?? 0),
          0
        );
        return sum / records.length;
      } else {
        return Math.max(
          ...records.map((rec: any) => rec.pitchReleaseSpeed ?? 0)
        );
      }
    }
    case 'Spin Efficiency': {
      if (avgMax === 'avg') {
        const sum = records.reduce(
          (acc: number, rec: any) => acc + (rec.spinEfficiency ?? 0),
          0
        );
        return sum / records.length;
      } else {
        return Math.max(...records.map((rec: any) => rec.spinEfficiency ?? 0));
      }
    }
    case 'Induced Vertical Break': {
      if (avgMax === 'avg') {
        const sum = records.reduce(
          (acc: number, rec: any) => acc + (rec.inducedVerticalBreak ?? 0),
          0
        );
        return sum / records.length;
      } else {
        return Math.max(
          ...records.map((rec: any) => rec.inducedVerticalBreak ?? 0)
        );
      }
    }
    case 'Horizontal Break': {
      if (avgMax === 'avg') {
        const sum = records.reduce(
          (acc: number, rec: any) => acc + (rec.horizontalBreak ?? 0),
          0
        );
        return sum / records.length;
      } else {
        return Math.max(...records.map((rec: any) => rec.horizontalBreak ?? 0));
      }
    }
    case 'Spin Rate': {
      if (avgMax === 'avg') {
        const sum = records.reduce(
          (acc: number, rec: any) => acc + (rec.spinRate ?? 0),
          0
        );
        return sum / records.length;
      } else {
        return Math.max(...records.map((rec: any) => rec.spinRate ?? 0));
      }
    }
    default:
      return 0;
  }
}

function calculateCurrentIntended(
  metric: string,
  avgMax: string,
  records: any[]
): number {
  switch (metric) {
    case 'Distance':
      if (avgMax === 'avg') {
        const sum = records.reduce(
          (acc: number, rec: any) => acc + (rec.distanceIn ?? 0),
          0
        );
        return sum / records.length;
      } else {
        return Math.min(...records.map((rec: any) => rec.distanceIn ?? 0));
      }
    default:
      return 0;
  }
}
