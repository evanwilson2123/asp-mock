import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

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

  try {
    const data = await prisma.blastMotion.findMany({
      where: { playLevel: level },
      orderBy: { date: 'desc' },
    });

    // if (!data || data.length === 0) {
    //   return NextResponse.json(
    //     { error: 'No BlastMotion data found for this level' },
    //     { status: 404 }
    //   );
    // }

    // Group data by date (formatted as YYYY-MM-DD)
    const dateGroups: Record<
      string,
      { batSpeeds: number[]; handSpeeds: number[] }
    > = {};

    data.forEach((record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = { batSpeeds: [], handSpeeds: [] };
      }
      if (record.batSpeed) {
        dateGroups[dateStr].batSpeeds.push(record.batSpeed);
      }
      if (record.peakHandSpeed) {
        dateGroups[dateStr].handSpeeds.push(record.peakHandSpeed);
      }
    });

    // Calculate averages for each date
    const sessionAverages = Object.keys(dateGroups).map((date) => {
      const group = dateGroups[date];
      return {
        date,
        avgBatSpeed:
          group.batSpeeds.length > 0
            ? group.batSpeeds.reduce((a, b) => a + b, 0) /
              group.batSpeeds.length
            : 0,
        avgHandSpeed:
          group.handSpeeds.length > 0
            ? group.handSpeeds.reduce((a, b) => a + b, 0) /
              group.handSpeeds.length
            : 0,
      };
    });

    // Calculate overall max values
    const maxBatSpeed = Math.max(...data.map((record) => record.batSpeed || 0));
    const maxHandSpeed = Math.max(
      ...data.map((record) => record.peakHandSpeed || 0)
    );

    return NextResponse.json({
      maxBatSpeed,
      maxHandSpeed,
      sessionAverages,
    });
  } catch (error: any) {
    console.error('Error fetching BlastMotion data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BlastMotion data' },
      { status: 500 }
    );
  }
}
