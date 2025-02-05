import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
  }

  try {
    const { athleteId, pitches } = await req.json();
    if (!athleteId || !pitches) {
      return NextResponse.json(
        { error: 'Invalid Request Body' },
        { status: 400 }
      );
    }

    // Generate a sessionId for this pitching session.
    const sessionId = crypto.randomUUID();

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

    return NextResponse.json({ sessionId: sessionId }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
