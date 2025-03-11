import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import Athlete from '@/models/athlete';
import Goal from '@/models/goal';
import { connectDB } from '@/lib/db';
import crypto from 'crypto';

interface CurrentResponse {
  current: number;
  sum?: number;
  length?: number;
  avgMax: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
  }

  try {
    await connectDB();
    const { athleteId, pitches } = await req.json();
    if (!athleteId || !pitches) {
      return NextResponse.json(
        { error: 'Invalid Request Body' },
        { status: 400 }
      );
    }

    // Generate a sessionId for this pitching session.
    const sessionId = crypto.randomUUID();

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json(
        { error: 'Could not find athlete' },
        { status: 404 }
      );
    }

    athlete.intended.push(sessionId);
    await athlete.save();

    // Map each pitch to the Intended model fields.
    const intendedRecords = pitches.map((pitch: any) => ({
      sessionId,
      athleteId,
      pitchType: pitch.pitchType,
      intendedX: pitch.intended.x,
      intendedY: pitch.intended.y,
      actualX: pitch.actual.x,
      actualY: pitch.actual.y,
      distanceIn: pitch.distance.inches,
      distancePer: pitch.distance.percent,
      playLevel: pitch.level,
    }));

    // Insert all pitch records in one call.
    await prisma.intended.createMany({
      data: intendedRecords,
    });

    // Fetch all existing goals for the athlete that track Intended Zone metrics
    const goals = await Goal.find({
      athlete: athleteId,
      tech: 'Intended Zone',
    });

    if (goals.length > 0) {
      // Fetch updated Intended Zone data
      const intendedPitches = await prisma.intended.findMany({
        where: { athleteId: athleteId },
      });

      for (const goal of goals) {
        const updatedCurrent = calculateCurrentIntended(
          goal.metricToTrack,
          goal.avgMax,
          intendedPitches
        );

        // Update goal with new progress
        goal.currentValue = updatedCurrent.current;
        goal.sum = updatedCurrent.sum;
        goal.length = updatedCurrent.length;

        await goal.save();
      }
    }

    return NextResponse.json({ sessionId: sessionId }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// **Refactored calculateCurrentIntended**
function calculateCurrentIntended(
  metric: string,
  avgMax: string,
  records: any[]
): CurrentResponse {
  const getSum = (key: string) =>
    records.reduce((acc: number, rec: any) => acc + (rec[key] ?? 0), 0);

  const getMin = (key: string) =>
    Math.min(...records.map((rec: any) => rec[key] ?? 0));

  let key = '';
  switch (metric) {
    case 'Distance':
      key = 'distanceIn';
      break;
    default:
      return { current: 0, sum: 0, length: 0, avgMax };
  }

  if (avgMax === 'avg') {
    const sum = getSum(key);
    return {
      current: sum / records.length,
      sum,
      length: records.length,
      avgMax,
    };
  } else {
    return { current: getMin(key), sum: 0, length: 0, avgMax };
  }
}
