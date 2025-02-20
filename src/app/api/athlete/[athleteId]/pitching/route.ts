import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

interface Response {
  trackman: boolean;
  intended: boolean;
  armCare: boolean;
  noneExist: boolean;
}

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json(
      { error: 'Missing athlete ID param' },
      { status: 400 }
    );
  }
  try {
    let trackmanExists = true;
    let armCareExists = true;
    let intendedExists = true;
    let noneExist = false;
    const trackman = await prisma.trackman.findFirst({
      where: {
        athleteId: athleteId,
      },
    });
    const intended = await prisma.intended.findFirst({
      where: {
        athleteId: athleteId,
      },
    });
    const armCare = await prisma.armCare.findFirst({
      where: {
        athlete: athleteId,
      },
    });
    if (!trackman) {
      trackmanExists = false;
    }
    if (!intended) {
      intendedExists = false;
    }
    if (!armCare) {
      armCareExists = false;
    }
    if (!trackman && !intended && !armCare) {
      noneExist = true;
    }
    const resp: Response = {
      trackman: trackmanExists,
      intended: intendedExists,
      armCare: armCareExists,
      noneExist: noneExist,
    };
    return NextResponse.json({ resp }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
