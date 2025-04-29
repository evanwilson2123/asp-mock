import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

/* ------------- helper to convert range → Date ------------- */
function getStartDate(range: string | null): Date | null {
  if (!range || range.toUpperCase() === 'ALL') return null;
  const now = new Date();
  switch (range) {
    case 'Past Week':
      now.setDate(now.getDate() - 7);
      break;
    case 'Past Month':
      now.setMonth(now.getMonth() - 1);
      break;
    case 'Past 3 Months':
      now.setMonth(now.getMonth() - 3);
      break;
    case 'Past 6 Months':
      now.setMonth(now.getMonth() - 6);
      break;
    case 'Past Year':
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return null;
  }
  return now;
}

export async function GET(req: NextRequest): Promise<
  | NextResponse<{ error: string }>
  | NextResponse<{
      maxBatSpeed: number;
      maxHandSpeed: number;
      sessionAverages: {
        date: string;
        avgBatSpeed: number;
        avgHandSpeed: number;
      }[];
    }>
> {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || 'High School';
  const timeRange = searchParams.get('range');
  const startDate = getStartDate(timeRange);

  try {
    const data = await prisma.blastMotion.findMany({
      where: {
        playLevel: level,
        ...(startDate && { date: { gte: startDate } }),
      },
      orderBy: { date: 'desc' },
    });

    /* ---------- aggregate averages by date ---------- */
    const groups: Record<string, { bats: number[]; hands: number[] }> = {};
    data.forEach((r) => {
      const d = r.date.toISOString().split('T')[0];
      if (!groups[d]) groups[d] = { bats: [], hands: [] };
      if (r.batSpeed) groups[d].bats.push(r.batSpeed);
      if (r.peakHandSpeed) groups[d].hands.push(r.peakHandSpeed);
    });

    const sessionAverages = Object.entries(groups).map(([date, g]) => ({
      date,
      avgBatSpeed: g.bats.reduce((a, b) => a + b, 0) / (g.bats.length || 1),
      avgHandSpeed: g.hands.reduce((a, b) => a + b, 0) / (g.hands.length || 1),
    }));

    /* ---------- safe “max” values ---------- */
    const maxBatSpeed = data.length
      ? Math.max(...data.map((r) => r.batSpeed ?? 0))
      : 0;
    const maxHandSpeed = data.length
      ? Math.max(...data.map((r) => r.peakHandSpeed ?? 0))
      : 0;

    return NextResponse.json({
      maxBatSpeed,
      maxHandSpeed,
      sessionAverages,
    });
  } catch (err) {
    console.error('Error fetching BlastMotion data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch BlastMotion data' },
      { status: 500 }
    );
  }
}
