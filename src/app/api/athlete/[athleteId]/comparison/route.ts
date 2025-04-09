import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

function aggregateDataBySession(data: any[], field: string) {
  // Group results by sessionId and accumulate sums and counts.
  const grouped: Record<
    string,
    { total: number; count: number; earliest: string }
  > = {};

  data.forEach((item) => {
    if (!item.sessionId) return;
    const value = Number(item[field]);
    if (isNaN(value)) return;
    if (!grouped[item.sessionId]) {
      grouped[item.sessionId] = {
        total: value,
        count: 1,
        earliest: item.createdAt,
      };
    } else {
      grouped[item.sessionId].total += value;
      grouped[item.sessionId].count += 1;
      // update the earliest date if needed
      if (
        new Date(item.createdAt) < new Date(grouped[item.sessionId].earliest)
      ) {
        grouped[item.sessionId].earliest = item.createdAt;
      }
    }
  });

  // Map the grouped data into an array with a consistent format.
  const result = Object.keys(grouped).map((sessionId) => ({
    sessionId,
    average: grouped[sessionId].total / grouped[sessionId].count,
    createdAt: grouped[sessionId].earliest,
  }));

  // Sort by sessionId (or by createdAt if you prefer)
  result.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
  return result;
}

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId parameter');
    return NextResponse.json(
      { error: 'Missing athleteId parameter' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    // Get search parameters from the request
    const { searchParams } = req.nextUrl;
    const metric1 = searchParams.get('metric1'); // e.g., "batSpeed"
    const metric2 = searchParams.get('metric2');
    const tech1 = searchParams.get('tech1'); // e.g., "blastMotion"
    const tech2 = searchParams.get('tech2');

    console.log('Metric1:', metric1);
    console.log('Metric2:', metric2);
    console.log('Tech1:', tech1);
    console.log('Tech2:', tech2);

    // Dynamic model access for metric1
    const modelMetric1 = prisma[tech1 as keyof typeof prisma] as any;
    let metric1Data: any;
    if (tech1 === 'blastMotion' || tech1 === 'hitTrax') {
      metric1Data = await modelMetric1.findMany({
        where: {
          athlete: athleteId,
        },
        select: {
          createdAt: true,
          [metric1 as any]: true,
          sessionId: true,
        },
      });
    } else {
      metric1Data = await modelMetric1.findMany({
        where: {
          athleteId: athleteId,
        },
        select: {
          createdAt: true,
          [metric1 as any]: true,
          sessionId: true,
        },
      });
    }

    // Dynamic model access for metric2
    const modelMetric2 = prisma[tech2 as keyof typeof prisma] as any;
    let metric2Data: any;
    if (tech2 === 'blastMotion' || tech2 === 'hitTrax') {
      metric2Data = await modelMetric2.findMany({
        where: {
          athlete: athleteId,
        },
        select: {
          createdAt: true,
          [metric2 as any]: true,
          sessionId: true,
        },
      });
    } else {
      metric2Data = await modelMetric2.findMany({
        where: {
          athleteId: athleteId,
        },
        select: {
          createdAt: true,
          [metric2 as any]: true,
          sessionId: true,
        },
      });
    }

    // Aggregate the data by session and compute the average per session.
    const aggregatedMetric1 = aggregateDataBySession(metric1Data, metric1!);
    const aggregatedMetric2 = aggregateDataBySession(metric2Data, metric2!);

    // Transform the aggregated data into Chart.js friendly format.
    // Each object will have "x" as the session's earliest date, and "y" as the average value.
    const formatForChart = (data: any[]) =>
      data.map((item) => ({
        x: new Date(item.createdAt).toISOString(),
        y: item.average,
        sessionId: item.sessionId,
      }));

    const formattedMetric1Data = formatForChart(aggregatedMetric1);
    const formattedMetric2Data = formatForChart(aggregatedMetric2);

    return NextResponse.json(
      {
        metric1: formattedMetric1Data,
        metric2: formattedMetric2Data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
