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
    const goals = await Goal.find({
      where: {
        athlete: athleteId,
      },
    }).exec();
    return NextResponse.json({ goals: goals || [] }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
