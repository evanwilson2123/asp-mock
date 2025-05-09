import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

interface Response {
  trackman: boolean;
  intended: boolean;
  armCare: boolean;
  noneExist: boolean;
}

/**
 *
 * @param req
 * @param context
 *
 * This endpoint is intended to provide the required information for the 'Pitching' page to dynamically render only the
 * technologies that the user has data for. This ensures that the athlete does not go in search of data that does not
 * exist and avoids all 404 errors.
 *
 * @returns { Response }
 */
export async function GET(req: NextRequest, context: any) {
  /* ===== AUTHENTICATE THE USER AND OBTAIN THE ATHLETE ID ===== */
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
    /* ===== INITIALIZE THE FIELDS BELONGING TO RESPONSE ===== */
    let trackmanExists = true;
    let armCareExists = true;
    let intendedExists = true;
    let noneExist = false;

    /**
     * TODO: asynchronously fetch this data in an await Promise.all()
     */
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

    /* ====== RUN CHECKS ON DATA TO ESTABLISH EXISTENCE ===== */
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

    /* ===== CONSTRUCT THE RESPONSE OBJECT ===== */
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
