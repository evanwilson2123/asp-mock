import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/hittrax/:athleteId
 *
 * This API endpoint retrieves **HitTrax** data for a specific athlete. It provides:
 * - **Global max metrics** for exit velocity and distance
 * - **Hard Hit Average** (percentage of hits with exit velocity ≥ 95 mph)
 * - **Session averages** for exit velocity and launch angle (overall)
 * - **Zone-specific averages** for exit velocity and launch angle by pull, center, and oppo
 * - **Session metadata** (IDs and dates) for navigation and charting
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** This endpoint requires the user to be authenticated via Clerk.
 * - Returns **400 AUTH FAILED** if authentication is unsuccessful.
 *
 * ---
 *
 * @pathParam {string} athleteId - The unique ID of the athlete whose HitTrax data is being requested.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the global max values, hard hit average, session averages and zone averages for the athlete.
 *   ```json
 *   {
 *     "maxExitVelo": 102,
 *     "maxDistance": 420,
 *     "hardHitAverage": 0.35,
 *     "sessionAverages": [
 *       {
 *         "sessionId": "sess_001",
 *         "date": "2024-05-01",
 *         "avgExitVelo": 90,
 *         "avgLA": 1.2
 *       },
 *       {
 *         "sessionId": "sess_002",
 *         "date": "2024-06-01",
 *         "avgExitVelo": 88,
 *         "avgLA": 1.1
 *       }
 *     ],
 *     "sessions": [
 *       { "sessionId": "sess_001", "date": "2024-05-01" },
 *       { "sessionId": "sess_002", "date": "2024-06-01" }
 *     ],
 *     "maxPullDistance": 400,
 *     "maxCenterDistance": 410,
 *     "maxOppoDistance": 395,
 *     "zoneAverages": [
 *       {
 *         "sessionId": "sess_001",
 *         "date": "2024-05-01",
 *         "pull": { "avgExitVelo": 92, "avgLA": 1.3 },
 *         "center": { "avgExitVelo": 88, "avgLA": 1.1 },
 *         "oppo": { "avgExitVelo": 90, "avgLA": 1.2 }
 *       },
 *       {
 *         "sessionId": "sess_002",
 *         "date": "2024-06-01",
 *         "pull": { "avgExitVelo": 91, "avgLA": 1.2 },
 *         "center": { "avgExitVelo": 87, "avgLA": 1.0 },
 *         "oppo": { "avgExitVelo": 89, "avgLA": 1.1 }
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error (400):**
 *   Occurs when authentication fails.
 *   ```json
 *   { "error": "AUTH FAILED" }
 *   ```
 *
 * - **Error (404):**
 *   Occurs when no HitTrax data is found for the specified athlete.
 *   ```json
 *   { "error": "No HitTrax data found for this athlete" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during data fetching.
 *   ```json
 *   { "error": "Failed to fetch HitTrax data", "details": "Internal server error details" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to fetch HitTrax data for an athlete
 * GET /api/hittrax/athlete_12345
 *
 * @errorHandling
 * - Returns **400** if authentication fails.
 * - Returns **404** if no HitTrax data exists for the athlete.
 * - Returns **500** for internal server/database errors.
 */

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'AUTH FAILED' }, { status: 400 });
  }

  const athleteId = context.params.athleteId;

  try {
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

    // Fetch handedness from BlastMotion (assuming one record exists for the athlete)
    const athleteInfo = await prisma.hitTrax.findFirst({
      where: { athlete: athleteId },
      select: { batting: true },
    });
    const handedness = athleteInfo?.batting || 'Right'; // Default to Right-handed if undefined

    // Define a margin for the center zone. Any sprayChartX between -centerZoneMargin and
    // centerZoneMargin is considered "center". This gives the center zone some room on either side.
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
      }
    > = {};

    let maxPullDistance = 0;
    let maxCenterDistance = 0;
    let maxOppoDistance = 0;

    for (const record of records) {
      const { sessionId, velo, dist, date, LA, sprayChartX } = record;

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
        };
      }

      if (velo) sessions[sessionId].velocities.push(velo);
      if (dist) sessions[sessionId].distances.push(dist);
      if (LA) sessions[sessionId].LAs.push(LA);

      // Determine hit direction based on handedness using the updated center zone margin.
      // Also, record zone-specific velocities and launch angles.
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
          // Right-handed
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

    // Calculate per-session zone averages (for pull, center, and oppo)
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

    // Hard Hit Average Calculation
    const hardHitAverage = totalEntries > 0 ? totalHardHits / totalEntries : 0;

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitAverage,
      sessionAverages,
      sessions: sessionAverages.map(({ sessionId, date }) => ({
        sessionId,
        date,
      })),
      maxPullDistance,
      maxCenterDistance,
      maxOppoDistance,
      zoneAverages: sessionZoneAverages,
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HitTrax data', details: error.message },
      { status: 500 }
    );
  }
}
