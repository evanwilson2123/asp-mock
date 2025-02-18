import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

interface HittraxBlast {
  athlete: string;
  blastId: string;
  hittraxId: string;
  squaredUpRate: number;
  attackAngle: number;
  launchAngle: number;
  exitVelo: number;
  result: string;
  potentialVelo: number;
  planeEfficiency: number;
  vertBatAngle: number;
  date: Date;
}

interface OverviewResponse {
  avgSquaredUpRate: number;
  sessions: {
    date: Date;
    avgSquaredUpRate: number;
  }[];
}

/**
 * Helper function to calculate average squared up rate
 */
function calculateAvgSquaredUpRate(swings: HittraxBlast[]): number {
  let total = 0;
  for (const swing of swings) {
    total += swing.squaredUpRate;
  }
  return total / swings.length;
}

/**
 * Calculate the session averages
 */
function calculateSessionAverages(squaredUpRates: number[]): number {
  let total = 0;
  for (const num of squaredUpRates) {
    total += num;
  }
  return total / squaredUpRates.length;
}

/**
 *
 * @param req
 * @param context
 * @returns
 */
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
      { error: 'Missing athlete ID parameter' },
      { status: 400 }
    );
  }
  try {
    // Initialize the map to store the array of squaredUpRates by date
    const dateMap: Map<string, number[] | undefined> = new Map();
    // Initialize the response to populate
    const overviewResponse: OverviewResponse = {
      avgSquaredUpRate: 0,
      sessions: [],
    };
    // Query for the blast swings
    const hittraxBlastSwings = await prisma.hittraxBlast.findMany({
      where: {
        athlete: athleteId,
      },
    });
    if (hittraxBlastSwings.length === 0) {
      return NextResponse.json({ error: 'No swings found' }, { status: 404 });
    }
    overviewResponse.avgSquaredUpRate =
      calculateAvgSquaredUpRate(hittraxBlastSwings);
    for (const swing of hittraxBlastSwings) {
      if (dateMap.has(swing.date.toISOString())) {
        dateMap.get(swing.date.toISOString())?.push(swing.squaredUpRate);
        continue;
      }
      dateMap.set(swing.date.toISOString(), [swing.squaredUpRate]);
    }
    for (const [date, nums] of dateMap) {
      const sessionAvg = calculateSessionAverages(nums!);
      overviewResponse.sessions.push({
        date: new Date(date),
        avgSquaredUpRate: sessionAvg,
      });
    }
    return NextResponse.json(overviewResponse, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
