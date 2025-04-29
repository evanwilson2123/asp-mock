import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

function getStartDate(r: string | null): Date | null {
  if (!r || r.toUpperCase() === 'ALL') return null;
  const d = new Date();
  switch (r) {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || 'High School';
  const range = searchParams.get('range');
  const startDate = getStartDate(range);

  try {
    const data = await prisma.trackman.findMany({
      where: {
        playLevel: level,
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    /* ---------- peak speeds by pitch type ---------- */
    const peaks: Record<string, number> = {};
    const avgPoints: {
      pitchType: string;
      avgSpeed: number;
      date: string;
    }[] = [];

    data.forEach((r) => {
      const type = r.pitchType || 'Unknown';
      const speed = r.pitchReleaseSpeed ?? 0;

      peaks[type] = peaks[type] ? Math.max(peaks[type], speed) : speed;
      avgPoints.push({
        pitchType: type,
        avgSpeed: speed,
        date: r.createdAt.toISOString(),
      });
    });

    /* ---------- format for client ---------- */
    const pitchStats = Object.entries(peaks).map(([pitchType, peakSpeed]) => ({
      pitchType,
      peakSpeed,
    }));

    return NextResponse.json({
      pitchStats,
      avgPitchSpeeds: avgPoints,
    });
  } catch (err) {
    console.error('Error fetching Trackman data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Trackman data.' },
      { status: 500 }
    );
  }
}
