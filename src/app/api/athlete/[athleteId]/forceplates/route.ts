import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface Test {
  id: number;
  date: Date;
}

interface Response {
  sjTests: Test[];
  cmjTests: Test[];
  imtpTests: Test[];
  hopTests: Test[];
}

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
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }
  try {
    const sjTests = await prisma.forceSJ.findMany({
      where: {
        athlete: athleteId,
      },
      select: {
        id: true,
        date: true,
      },
    });
    const cmjTests = await prisma.forceCMJ.findMany({
      where: {
        athlete: athleteId,
      },
      select: {
        id: true,
        date: true,
      },
    });
    const imtpTests = await prisma.forceIMTP.findMany({
      where: {
        athlete: athleteId,
      },
      select: {
        id: true,
        date: true,
      },
    });
    const hopTests = await prisma.forceHop.findMany({
      where: {
        athlete: athleteId,
      },
      select: {
        id: true,
        date: true,
      },
    });

    const response: Response = {
      sjTests: sjTests,
      cmjTests: cmjTests,
      imtpTests: imtpTests,
      hopTests: hopTests,
    };

    return NextResponse.json({ tests: response }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
