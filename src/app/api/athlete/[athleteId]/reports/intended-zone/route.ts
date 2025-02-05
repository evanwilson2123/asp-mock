import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
  }

  try {
    const { athleteId } = context.params;
    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athlete ID' },
        { status: 400 }
      );
    }

    const pitches = await prisma.intended.findMany({
      where: { athleteId },
    });

    if (!pitches || pitches.length === 0) {
      return NextResponse.json(
        { error: 'No pitching data found' },
        { status: 404 }
      );
    }

    // Group pitches by session
    const sessionsMap: {
      [sessionId: string]: {
        sessionId: string;
        date: string;
        pitches: typeof pitches;
      };
    } = {};

    pitches.forEach((pitch) => {
      if (!sessionsMap[pitch.sessionId]) {
        sessionsMap[pitch.sessionId] = {
          sessionId: pitch.sessionId,
          date: new Date(pitch.createdAt).toISOString().split('T')[0],
          pitches: [],
        };
      }
      sessionsMap[pitch.sessionId].pitches.push(pitch);
    });

    // Calculate session averages
    const intendedData = Object.values(sessionsMap).map((session) => {
      const pitchTypes = [...new Set(session.pitches.map((p) => p.pitchType))];

      const pitchData = pitchTypes.map((type) => {
        const filteredPitches = session.pitches.filter(
          (p) => p.pitchType === type
        );

        const avgMissInches =
          (filteredPitches.reduce((sum, p) => {
            const miss = Math.sqrt(
              Math.pow(p.actualX - p.intendedX, 2) +
                Math.pow(p.actualY - p.intendedY, 2)
            );
            return sum + miss;
          }, 0) /
            filteredPitches.length) *
          12; // Convert to inches

        const avgHorzInches =
          (filteredPitches.reduce(
            (sum, p) => sum + (p.actualX - p.intendedX),
            0
          ) /
            filteredPitches.length) *
          12; // Convert to inches

        const avgVertInches =
          (filteredPitches.reduce(
            (sum, p) => sum + (p.actualY - p.intendedY),
            0
          ) /
            filteredPitches.length) *
          12; // Convert to inches

        return {
          pitchType: type,
          avgMiss: parseFloat(avgMissInches.toFixed(2)), // Round to 2 decimals
          avgHorz: parseFloat(avgHorzInches.toFixed(2)),
          avgVert: parseFloat(avgVertInches.toFixed(2)),
        };
      });

      return {
        date: session.date,
        pitches: pitchData,
      };
    });

    // Global Averages Across All Sessions
    const globalPitchTypeMap: {
      [pitchType: string]: {
        totalMiss: number;
        totalHorz: number;
        totalVert: number;
        count: number;
      };
    } = {};

    pitches.forEach((pitch) => {
      const miss = Math.sqrt(
        Math.pow(pitch.actualX - pitch.intendedX, 2) +
          Math.pow(pitch.actualY - pitch.intendedY, 2)
      );

      if (!globalPitchTypeMap[pitch.pitchType]) {
        globalPitchTypeMap[pitch.pitchType] = {
          totalMiss: 0,
          totalHorz: 0,
          totalVert: 0,
          count: 0,
        };
      }

      globalPitchTypeMap[pitch.pitchType].totalMiss += miss * 12; // Convert to inches
      globalPitchTypeMap[pitch.pitchType].totalHorz +=
        (pitch.actualX - pitch.intendedX) * 12; // Convert to inches
      globalPitchTypeMap[pitch.pitchType].totalVert +=
        (pitch.actualY - pitch.intendedY) * 12; // Convert to inches
      globalPitchTypeMap[pitch.pitchType].count += 1;
    });

    const globalAverages = Object.entries(globalPitchTypeMap).map(
      ([pitchType, data]) => ({
        pitchType,
        avgMiss: parseFloat((data.totalMiss / data.count).toFixed(2)),
        avgHorz: parseFloat((data.totalHorz / data.count).toFixed(2)),
        avgVert: parseFloat((data.totalVert / data.count).toFixed(2)),
      })
    );

    const sessions = Object.values(sessionsMap).map((session) => ({
      sessionId: session.sessionId,
      date: session.date,
    }));

    return NextResponse.json(
      { intendedData, sessions, globalAverages },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
