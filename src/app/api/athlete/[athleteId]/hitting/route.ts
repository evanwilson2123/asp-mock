import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface Resp {
  hittrax: boolean;
  blast: boolean;
  hittraxBlast: boolean;
  hasNone: boolean;
}

/**
 *
 * @param req
 * @param context
 *
 * This endpoint is intended to provide the 'Hitting' page with the required info to dynamically render only the technologies that the athlete has data for.
 * This ensures that there is no confusion when the athlete is attempting to view their data and they will never run into 404 errors searching for data
 * that has yet to exist.
 * @returns { Resp }
 */
export async function GET(req: NextRequest, context: any) {
  /* ===== AUTHENTICATE THE USER AND OBTAIN ATHLETE ID FROM PARAMS ===== */
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
    /* ===== INITIALIZE THE FIELDS THAT BELONG TO THE RESP INTERFACE ===== */
    let hasHittrax = true;
    let hasBlast = true;
    let hasHittraxBlast = true;
    let hasNone = false;

    /**
     * TODO: fetch these asynchronously in an await Promise.all()
     */
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

    /* ===== RUN CHECKS ON DATA TO ESTABLISH EXISTENCE ===== */
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

    /* ===== CONSTRUCT THE RESPONSE OBJECT ===== */
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
