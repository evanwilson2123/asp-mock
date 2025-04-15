import { NextRequest, NextResponse } from 'next/server';
import Athlete from '@/models/athlete';
import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: NextRequest,
  context: any // Match the expected context type
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }

  try {
    await connectDB();
    const athleteId = await context.params.athleteId; // Access `athleteId` from `context.params`

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Athlete ID missing' },
        { status: 400 }
      );
    }

    const { searchParams } = req.nextUrl;
    const isAthlete = searchParams.get('isAthlete');
    if (!isAthlete) {
      console.log('Missing search param');
      return NextResponse.json(
        { error: 'Missing is athlete search param' },
        { status: 400 }
      );
    }

    const athlete = await Athlete.findById(athleteId).exec();

    console.log('Athlete: ', JSON.stringify(athlete));

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found in database' },
        { status: 404 }
      );
    }

    if (isAthlete === 'true') {
      athlete.coachesNotes = athlete.coachesNotes.filter(
        (n: any) => n.isAthlete
      );
    }

    return NextResponse.json({ athlete }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
