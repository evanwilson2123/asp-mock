import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/* ------------------------------------------------------------------ */
/* Date‑range helper                                                  */
/* ------------------------------------------------------------------ */
function getStartDate(range: string | null): Date | null {
  if (!range || range.toUpperCase() === 'ALL') return null;
  const d = new Date();
  switch (range) {
    case 'Past Week':
      d.setDate(d.getDate() - 7);
      break;
    case 'Past Month':
      d.setMonth(d.getMonth() - 1);
      break;
    case 'Past 3 Months':
      d.setMonth(d.getMonth() - 3);
      break;
    case 'Past 6 Months':
      d.setMonth(d.getMonth() - 6);
      break;
    case 'Past Year':
      d.setFullYear(d.getFullYear() - 1);
      break;
    default:
      return null;
  }
  return d;
}

/* ==================================================================
 * GET /api/athlete/[athleteId]/stats?range=Past%20Month
 * ================================================================= */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated request' },
      { status: 401 }
    );
  }

  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }

  /* ---------- optional time‑range filter ---------- */
  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get('range');
  const startDate = getStartDate(timeRange);

  try {
    /* ------------------------------------------------------------------
     * 1) RAW QUERIES (field names match schema you provided)
     * ---------------------------------------------------------------- */
    const [blastRows, hitRows, trackRows] = await Promise.all([
      prisma.blastMotion.findMany({
        where: {
          athlete: athleteId,
          ...(startDate && { date: { gte: startDate } }),
        },
        select: { date: true, batSpeed: true, peakHandSpeed: true },
      }),

      prisma.hitTrax.findMany({
        where: {
          athlete: athleteId,
          ...(startDate && { date: { gte: startDate } }),
        },
        select: {
          date: true,
          velo: true, // exit velo
          dist: true, // distance
        },
      }),

      prisma.trackman.findMany({
        where: {
          athleteId,
          ...(startDate && { createdAt: { gte: startDate } }),
        },
        select: {
          createdAt: true, // use createdAt as date
          pitchType: true,
          pitchReleaseSpeed: true,
        },
      }),
    ]);

    /* ------------------------------------------------------------------
     * 2) BLAST AGGREGATION
     * ---------------------------------------------------------------- */
    const blastMaxBat = Math.max(0, ...blastRows.map((r) => r.batSpeed ?? 0));
    const blastMaxHand = Math.max(
      0,
      ...blastRows.map((r) => r.peakHandSpeed ?? 0)
    );

    const blastDayMap: Record<
      string,
      { batTotal: number; handTotal: number; count: number }
    > = {};
    blastRows.forEach((r) => {
      const key = r.date.toISOString().split('T')[0];
      if (!blastDayMap[key])
        blastDayMap[key] = { batTotal: 0, handTotal: 0, count: 0 };
      blastDayMap[key].batTotal += r.batSpeed ?? 0;
      blastDayMap[key].handTotal += r.peakHandSpeed ?? 0;
      blastDayMap[key].count += 1;
    });
    const blastSessionAverages = Object.entries(blastDayMap)
      .map(([date, v]) => ({
        date,
        avgBatSpeed: v.batTotal / v.count,
        avgHandSpeed: v.handTotal / v.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    /* ------------------------------------------------------------------
     * 3) HITTRAX AGGREGATION
     * ---------------------------------------------------------------- */
    const hitMaxEV = Math.max(0, ...hitRows.map((r) => r.velo ?? 0));
    const hitMaxDist = Math.max(0, ...hitRows.map((r) => r.dist ?? 0));

    const hardHitPct =
      hitRows.length === 0
        ? 0
        : hitRows.filter((r) => (r.velo ?? 0) >= 95).length / hitRows.length;

    const hitDayMap: Record<string, { veloTotal: number; count: number }> = {};
    hitRows.forEach((r) => {
      const day = r.date ? r.date.toISOString().split('T')[0] : null;
      if (!day) return;
      if (!hitDayMap[day]) hitDayMap[day] = { veloTotal: 0, count: 0 };
      hitDayMap[day].veloTotal += r.velo ?? 0;
      hitDayMap[day].count += 1;
    });
    const hitSessionAverages = Object.entries(hitDayMap)
      .map(([date, v]) => ({
        date,
        avgExitVelo: v.veloTotal / v.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    /* ------------------------------------------------------------------
     * 4) TRACKMAN AGGREGATION
     * ---------------------------------------------------------------- */
    const peakMap: Record<string, number> = {};
    const avgMap: Record<
      string,
      Record<string, { total: number; count: number }>
    > = {};

    trackRows.forEach((r) => {
      const speed = r.pitchReleaseSpeed ?? 0;
      const type = r.pitchType ?? 'Unknown';
      /* peak */
      if (!peakMap[type] || speed > peakMap[type]) peakMap[type] = speed;

      /* per‑date avg */
      const day = r.createdAt.toISOString().split('T')[0];
      if (!avgMap[day]) avgMap[day] = {};
      if (!avgMap[day][type]) avgMap[day][type] = { total: 0, count: 0 };
      avgMap[day][type].total += speed;
      avgMap[day][type].count += 1;
    });

    const pitchStats = Object.entries(peakMap).map(([pitchType, peak]) => ({
      pitchType,
      peakSpeed: peak,
    }));

    const avgPitchSpeeds = Object.entries(avgMap)
      .flatMap(([date, inner]) =>
        Object.entries(inner).map(([pitchType, v]) => ({
          date,
          pitchType,
          avgSpeed: v.total / v.count,
        }))
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    /* ------------------------------------------------------------------
     * 5) Construct payload (matches front‑end)
     * ---------------------------------------------------------------- */
    const payload = {
      blast: {
        maxBatSpeed: blastMaxBat || undefined,
        maxHandSpeed: blastMaxHand || undefined,
        sessionAverages: blastSessionAverages,
      },
      hittrax: {
        maxExitVelo: hitMaxEV || undefined,
        maxDistance: hitMaxDist || undefined,
        hardHitAverage: hardHitPct || undefined,
        sessionAverages: hitSessionAverages,
      },
      trackman: {
        pitchStats,
        avgPitchSpeeds,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
