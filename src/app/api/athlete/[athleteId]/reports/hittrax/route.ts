import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import Athlete from '@/models/athlete';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'AUTH FAILED' }, { status: 400 });
  }

  const athleteId = context.params.athleteId;

  try {
    const { searchParams } = req.nextUrl;
    const isAthlete = searchParams.get('isAthlete');

    const records = await prisma.hitTrax.findMany({
      where: { athlete: athleteId },
      orderBy: { date: 'desc' },
    });

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'No HitTrax data found for this athlete' },
        { status: 404 }
      );
    }

    // Fetch handedness from HitTrax (assuming one record exists for the athlete)
    const athleteInfo = await prisma.hitTrax.findFirst({
      where: { athlete: athleteId },
      select: { batting: true },
    });
    const handedness = athleteInfo?.batting || 'Right'; // Default to Right-handed if undefined

    const centerZoneMargin = 15;

    // Group records by sessionId and initialize zone-specific arrays.
    const sessions: Record<
      string,
      {
        velocities: number[];
        distances: number[];
        date: string;
        LAs: number[];
        zonePullVelo: number[];
        zonePullLA: number[];
        zoneCenterVelo: number[];
        zoneCenterLA: number[];
        zoneOppoVelo: number[];
        zoneOppoLA: number[];
        sessionName: string;
      }
    > = {};

    let maxPullDistance = 0;
    let maxCenterDistance = 0;
    let maxOppoDistance = 0;

    for (const record of records) {
      const { sessionId, velo, dist, date, LA, sprayChartX, sessionName } =
        record;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          velocities: [],
          distances: [],
          date: date ? new Date(date).toISOString().split('T')[0] : 'No Date',
          LAs: [],
          zonePullVelo: [],
          zonePullLA: [],
          zoneCenterVelo: [],
          zoneCenterLA: [],
          zoneOppoVelo: [],
          zoneOppoLA: [],
          sessionName: sessionName || '', // Capture sessionName here
        };
      } else if (!sessions[sessionId].sessionName && sessionName) {
        // If not yet set, update with the record's sessionName
        sessions[sessionId].sessionName = sessionName;
      }

      if (velo) sessions[sessionId].velocities.push(velo);
      if (dist) sessions[sessionId].distances.push(dist);
      if (LA) sessions[sessionId].LAs.push(LA);

      if (sprayChartX !== null && dist) {
        if (handedness === 'Left') {
          if (sprayChartX < -centerZoneMargin) {
            maxPullDistance = Math.max(maxPullDistance, dist);
            if (velo) sessions[sessionId].zonePullVelo.push(velo);
            if (LA) sessions[sessionId].zonePullLA.push(LA);
          } else if (sprayChartX > centerZoneMargin) {
            maxOppoDistance = Math.max(maxOppoDistance, dist);
            if (velo) sessions[sessionId].zoneOppoVelo.push(velo);
            if (LA) sessions[sessionId].zoneOppoLA.push(LA);
          } else {
            maxCenterDistance = Math.max(maxCenterDistance, dist);
            if (velo) sessions[sessionId].zoneCenterVelo.push(velo);
            if (LA) sessions[sessionId].zoneCenterLA.push(LA);
          }
        } else {
          if (sprayChartX > centerZoneMargin) {
            maxPullDistance = Math.max(maxPullDistance, dist);
            if (velo) sessions[sessionId].zonePullVelo.push(velo);
            if (LA) sessions[sessionId].zonePullLA.push(LA);
          } else if (sprayChartX < -centerZoneMargin) {
            maxOppoDistance = Math.max(maxOppoDistance, dist);
            if (velo) sessions[sessionId].zoneOppoVelo.push(velo);
            if (LA) sessions[sessionId].zoneOppoLA.push(LA);
          } else {
            maxCenterDistance = Math.max(maxCenterDistance, dist);
            if (velo) sessions[sessionId].zoneCenterVelo.push(velo);
            if (LA) sessions[sessionId].zoneCenterLA.push(LA);
          }
        }
      }
    }

    // Calculate overall session stats
    let maxExitVelo = 0;
    let maxDistance = 0;
    let totalHardHits = 0;
    let totalEntries = 0;

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const { velocities, distances, date, LAs } = sessions[sessionId];

      if (velocities.length > 0) {
        maxExitVelo = Math.max(maxExitVelo, ...velocities);
        const sessionTotal = velocities.reduce((sum, v) => sum + v, 0);
        const laTotal = LAs.reduce((sum, la) => sum + la, 0);
        totalEntries += velocities.length;
        totalHardHits += velocities.filter((v) => v >= 95).length;
        const avgExitVelo = sessionTotal / velocities.length;
        const avgLA = laTotal / LAs.length;

        if (distances.length > 0) {
          maxDistance = Math.max(maxDistance, ...distances);
        }

        return { sessionId, date, avgExitVelo, avgLA };
      }

      return { sessionId, date, avgExitVelo: 0, avgLA: 0 };
    });

    // Calculate per-session zone averages
    const sessionZoneAverages = Object.keys(sessions).map((sessionId) => {
      const session = sessions[sessionId];

      const pullAvgExitVelo =
        session.zonePullVelo.length > 0
          ? session.zonePullVelo.reduce((sum, v) => sum + v, 0) /
            session.zonePullVelo.length
          : 0;
      const pullAvgLA =
        session.zonePullLA.length > 0
          ? session.zonePullLA.reduce((sum, v) => sum + v, 0) /
            session.zonePullLA.length
          : 0;

      const centerAvgExitVelo =
        session.zoneCenterVelo.length > 0
          ? session.zoneCenterVelo.reduce((sum, v) => sum + v, 0) /
            session.zoneCenterVelo.length
          : 0;
      const centerAvgLA =
        session.zoneCenterLA.length > 0
          ? session.zoneCenterLA.reduce((sum, v) => sum + v, 0) /
            session.zoneCenterLA.length
          : 0;

      const oppoAvgExitVelo =
        session.zoneOppoVelo.length > 0
          ? session.zoneOppoVelo.reduce((sum, v) => sum + v, 0) /
            session.zoneOppoVelo.length
          : 0;
      const oppoAvgLA =
        session.zoneOppoLA.length > 0
          ? session.zoneOppoLA.reduce((sum, v) => sum + v, 0) /
            session.zoneOppoLA.length
          : 0;

      return {
        sessionId,
        date: session.date,
        pull: { avgExitVelo: pullAvgExitVelo, avgLA: pullAvgLA },
        center: { avgExitVelo: centerAvgExitVelo, avgLA: centerAvgLA },
        oppo: { avgExitVelo: oppoAvgExitVelo, avgLA: oppoAvgLA },
      };
    });

    const hardHitAverage = totalEntries > 0 ? totalHardHits / totalEntries : 0;

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json(
        { error: 'Could not find athlete by ID' },
        { status: 404 }
      );
    }

    if (isAthlete === 'true') {
      athlete.coachesNotes = athlete.coachesNotes.filter(
        (n: any) => n.isAthlete
      );
    }

    athlete.coachesNotes = athlete.coachesNotes.filter(
      (n: any) => n.section === 'hittrax'
    );

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitAverage,
      sessionAverages,
      sessions: Object.keys(sessions).map((sessionId) => ({
        sessionId,
        date: sessions[sessionId].date,
        sessionName: sessions[sessionId].sessionName || '',
      })),
      maxPullDistance,
      maxCenterDistance,
      maxOppoDistance,
      zoneAverages: sessionZoneAverages,
      coachesNotes: athlete.coachesNotes,
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HitTrax data', details: error.message },
      { status: 500 }
    );
  }
}
