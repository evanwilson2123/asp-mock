import { NextRequest, NextResponse } from 'next/server';
import Athlete from '@/models/athlete';
import { connectDB } from '@/lib/db';
import { auth, clerkClient } from '@clerk/nextjs/server';


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

    athlete.coachesNotes = athlete.coachesNotes.filter(
      (n: any) => n.section === 'profile'
    );

    return NextResponse.json({ athlete }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Auth failed');
    return NextResponse.json({ error: 'Unauthorized Request' }, { status: 401 });
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    console.log("AthleteId is required");
    return NextResponse.json({ error: 'AthleteId is required' }, { status: 400 });
  }
  try {
    await connectDB();
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    await Athlete.deleteOne({ _id: athleteId }).exec();
    const client = await clerkClient();
    await client.users.deleteUser(athlete.clerkId);
    return NextResponse.json({ message: 'Athlete deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
