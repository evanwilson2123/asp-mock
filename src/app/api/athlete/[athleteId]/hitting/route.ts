import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface Resp {
  hittrax: boolean;
  blast: boolean;
  hittraxBlast: boolean;
  hasNone: boolean;
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
    console.log('missing athleteId');
    return NextResponse.json({ error: 'Missing athlete Id' }, { status: 400 });
  }
  try {
    let hasHittrax = true;
    let hasBlast = true;
    let hasHittraxBlast = true;
    let hasNone = false;
    const hittrax = await prisma.hitTrax.findFirst({
      where: {
        athlete: athleteId,
      },
    });
    const blast = await prisma.blastMotion.findFirst({
      where: {
        athlete: athleteId,
      },
    });
    const hittraxBlast = await prisma.hittraxBlast.findFirst({
      where: {
        athlete: athleteId,
      },
    });
    if (!hittrax) {
      hasHittrax = false;
    }
    if (!blast) {
      hasBlast = false;
    }
    if (!hittraxBlast) {
      hasHittraxBlast = false;
    }
    if (!hittrax && !blast && !hittraxBlast) {
      hasNone = true;
    }
    const resp: Resp = {
      hittrax: hasHittrax,
      blast: hasBlast,
      hittraxBlast: hasHittraxBlast,
      hasNone: hasNone,
    };
    return NextResponse.json(resp, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
