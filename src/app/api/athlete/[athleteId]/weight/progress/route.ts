import prisma from '@/lib/prismaDb';
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
    console.log('Missinb athleteId request parameter');
    return NextResponse.json(
      { error: 'Missing athleteId request parameter' },
      { status: 400 }
    );
  }
  try {
    const weightLogs = await prisma.weightLog.findMany({
      where: {
        athlete: athleteId,
      },
    });

    return NextResponse.json({ weightLogs: weightLogs }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
