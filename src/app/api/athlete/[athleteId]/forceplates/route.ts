import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface Test {
  id: number;
  date: Date;
  peakPowerW?: number;
  jmpHeight?: number;
  peakVertForce?: number;
  bestRSIF?: number;
}

interface CMJ_DATA {
  peakPower: number;
  jumpHeight: number;
}

interface SJ_DATA {
  peakPower: number;
  jumpHeight: number;
}

interface IMTP_DATA {
  peakVertForce: number;
}

interface HOP_DATA {
  rsi: number;
}

interface Response {
  sjTests: Test[];
  cmjTests: Test[];
  imtpTests: Test[];
  hopTests: Test[];
  cmjData: CMJ_DATA;
  sjData: SJ_DATA;
  imtpData: IMTP_DATA;
  hopData: HOP_DATA;
}


function getCMJData(cmjTests: Test[]) {
  let peakPower = 0;
  let jumpHeight = 0;
  cmjTests.forEach((test) => {
    if (test.peakPowerW! > peakPower) {
      peakPower = test.peakPowerW!;
    }
    if (test.jmpHeight! > jumpHeight) {
      jumpHeight = test.jmpHeight!;
    }
  });
  console.log(peakPower, jumpHeight);
  return { peakPower, jumpHeight };
}

function getSJData(sjTests: Test[]) {
  let peakPower = 0;
  let jumpHeight = 0;
  sjTests.forEach((test) => {
    if (test.peakPowerW! > peakPower) {
      peakPower = test.peakPowerW!;
    }
    if (test.jmpHeight! > jumpHeight) {
      jumpHeight = test.jmpHeight!;
    }
  });
  return { peakPower, jumpHeight };
}

function getIMTPData(imtpTests: Test[]) {
  let peakVertForce = 0;
  imtpTests.forEach((test) => {
    if (test.peakVertForce! > peakVertForce) {
      peakVertForce = test.peakVertForce!;
    }
  });
  return { peakVertForce };
}

function getHOPData(hopTests: Test[]) {
  let rsi = 0;
  hopTests.forEach((test) => {
    if (test.bestRSIF! > rsi) {
      rsi = test.bestRSIF!;
    }
  });
  return { rsi };
}
/**
 *
 * @param req
 * @param context
 * @returns
 *
 * TODO:
 * Gather the following data for each test:
 * CMJ: Peak Power, Jump Height
 * SJ: Peak Power, Jump Height
 * IMTP: Peak Vertical Force
 * Hop Test: RSI
 */

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
        jmpHeight: true,
        peakPowerW: true,
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
        bestRSIF: true,
      },
    });

    const response: Response = {
      sjTests: sjTests,
      cmjTests: cmjTests,
      imtpTests: imtpTests,
      hopTests: hopTests,
      cmjData: getCMJData(cmjTests),
      sjData: getSJData(sjTests),
      imtpData: getIMTPData(imtpTests),
      hopData: getHOPData(hopTests),
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
