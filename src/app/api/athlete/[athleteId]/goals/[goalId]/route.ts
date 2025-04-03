import { connectDB } from '@/lib/db';
import Goal from '@/models/goal';
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
  const { athleteId, goalId } = await context.params;
  if (!goalId) {
    console.log('missing parameter');
    return NextResponse.json(
      { error: 'Missing Goal ID param' },
      { status: 400 }
    );
  }
  console.log(athleteId);
  try {
    await connectDB();

    const goal = await Goal.find({ _id: goalId }).exec();
    if (!goal) {
      console.log('Goal not found for ID');
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ goal: goal }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
