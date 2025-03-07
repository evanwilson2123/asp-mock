import { connectDB } from '@/lib/db';
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
    const goal = new Goal({
      athlete: athleteId,
      goalName: goalName,
      tech,
      metricToTrack,
      goalValue,
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
