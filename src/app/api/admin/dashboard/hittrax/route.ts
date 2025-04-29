import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

function getStartDate(range: string | null): Date | null {
  if (!range || range.toUpperCase() === 'ALL') return null;
  const n = new Date();
  switch (range) {
    case 'Past Week':
      n.setDate(n.getDate() - 7);
      break;
    case 'Past Month':
      n.setMonth(n.getMonth() - 1);
      break;
    case 'Past 3 Months':
      n.setMonth(n.getMonth() - 3);
      break;
    case 'Past 6 Months':
      n.setMonth(n.getMonth() - 6);
      break;
    case 'Past Year':
      n.setFullYear(n.getFullYear() - 1);
      break;
    default:
      return null;
  }
  return n;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || 'High School';
  const range = searchParams.get('range');
  const startDate = getStartDate(range);

  try {
    const data = await prisma.hitTrax.findMany({
      where: {
        playLevel: level,
        ...(startDate && { date: { gte: startDate } }),
      },
      orderBy: { date: 'desc' },
    });

    /* ---------- per-session averages ---------- */
    const sessions: Record<
      string,
      { vels: number[]; dists: number[]; date: Date }
    > = {};

    data.forEach((r) => {
      const id = r.sessionId;
      if (!sessions[id])
        sessions[id] = { vels: [], dists: [], date: r.date || new Date() };
      if (r.velo) sessions[id].vels.push(r.velo);
      if (r.dist) sessions[id].dists.push(r.dist);
    });

    const sessionAverages = Object.entries(sessions).map(([sessionId, s]) => ({
      sessionId,
      date: s.date,
      avgExitVelo: s.vels.reduce((a, b) => a + b, 0) / (s.vels.length || 1),
    }));

    /* ---------- safe metrics ---------- */
    const maxExitVelo = data.length
      ? Math.max(...data.map((r) => r.velo ?? 0))
      : 0;
    const maxDistance = data.length
      ? Math.max(...data.map((r) => r.dist ?? 0))
      : 0;
    const hardHitRate = data.length
      ? data.filter((r) => (r.velo ?? 0) >= 95).length / data.length
      : 0;

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitRate,
      sessionAverages,
    });
  } catch (err) {
    console.error('Error fetching HitTrax data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch HitTrax data' },
      { status: 500 }
    );
  }
}
