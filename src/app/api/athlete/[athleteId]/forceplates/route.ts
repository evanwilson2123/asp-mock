import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface Test {
  id: number;
  date: Date;
  peakPowerW?: number;
  jmpHeight?: number;
  peakVerticalForce?: number;
  bestRSIF?: number;
  eccentricPeakForce?: number;
  takeoffPeakForceN?: number;
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
  peakVerticalForce: number;
}

interface HOP_DATA {
  rsi: number;
}

interface PPU_DATA {
  eccentricPeakForce: number;
  takeoffPeakForceN: number;
}

interface Response {
  sjTests: Test[];
  cmjTests: Test[];
  imtpTests: Test[];
  hopTests: Test[];
  ppuTests: Test[];
  cmjData: CMJ_DATA;
  sjData: SJ_DATA;
  imtpData: IMTP_DATA;
  hopData: HOP_DATA;
  ppuData: PPU_DATA;
  bodyWeight: number;
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
  let peakVerticalForce = 0;
  imtpTests.forEach((test) => {
    if (test.peakVerticalForce! > peakVerticalForce) {
      peakVerticalForce = test.peakVerticalForce!;
    }
  });
  return { peakVerticalForce };
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

function getPPUData(ppuTests: Test[]) {
  let eccentricPeakForce = 0;
  let takeoffPeakForceN = 0;
  ppuTests.forEach((test) => {
    if (test.eccentricPeakForce! > eccentricPeakForce) {
      eccentricPeakForce = test.eccentricPeakForce!;
    }
    if (test.takeoffPeakForceN! > takeoffPeakForceN) {
      takeoffPeakForceN = test.takeoffPeakForceN!;
    }
  });
  return { eccentricPeakForce, takeoffPeakForceN };
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
    await connectDB();

    const athlete = await Athlete.findById(athleteId);
    if (!athlete) {
      console.log('Athlete not found');
      return NextResponse.json({ error: 'Athlete not found' }, { status: 400 });
    }

    const bodyWeight = athlete.weight;

    const sjTests = await prisma.forceSJ.findMany({
      where: {
        athlete: athleteId,
      },
      select: {
        id: true,
        date: true,
        peakPowerW: true,
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
        peakVerticalForce: true,
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

    const ppuTests = await prisma.forcePPU.findMany({
      where: {
        athlete: athleteId,
      },
      select: {
        id: true,
        date: true,
        eccentricPeakForce: true,
        takeoffPeakForceN: true,
      },
    });

    const response: Response = {
      sjTests: sjTests,
      cmjTests: cmjTests,
      imtpTests: imtpTests,
      hopTests: hopTests,
      ppuTests: ppuTests,
      cmjData: getCMJData(cmjTests),
      sjData: getSJData(sjTests),
      imtpData: getIMTPData(imtpTests),
      hopData: getHOPData(hopTests),
      ppuData: getPPUData(ppuTests),
      bodyWeight: bodyWeight,
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
