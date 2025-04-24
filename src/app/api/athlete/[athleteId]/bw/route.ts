import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId in request parameters');
    return NextResponse.json(
      { error: 'Missing athleteId request parameter' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      console.log('Athlete not found with ID');
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    return NextResponse.json(
      { height: athlete.height, weight: athlete.weight },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
