import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/hittrax/:athleteId
 *
 * This API endpoint retrieves **HitTrax** data for a specific athlete. It provides:
 * - **Global max metrics** for exit velocity and distance
 * - **Hard Hit Average** (percentage of hits with exit velocity ≥ 95 mph)
 * - **Session averages** for exit velocity
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
 *   Returns the global max values, hard hit average, and session averages for the athlete.
 *   ```json
 *   {
 *     "maxExitVelo": 102,
 *     "maxDistance": 420,
 *     "hardHitAverage": 0.35,
 *     "sessionAverages": [
 *       {
 *         "sessionId": "sess_001",
 *         "date": "2024-05-01",
 *         "avgExitVelo": 90
 *       },
 *       {
 *         "sessionId": "sess_002",
 *         "date": "2024-06-01",
 *         "avgExitVelo": 88
 *       }
 *     ],
 *     "sessions": [
 *       { "sessionId": "sess_001", "date": "2024-05-01" },
 *       { "sessionId": "sess_002", "date": "2024-06-01" }
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
      orderBy: { date: 'desc' }, // Sort by session date (latest first)
    });

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'No HitTrax data found for this athlete' },
        { status: 404 }
      );
    }

    // Group records by sessionId
    const sessions: Record<
      string,
      { velocities: number[]; distances: number[]; date: string }
    > = {};

    for (const record of records) {
      const { sessionId, velo, dist, date } = record;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          velocities: [],
          distances: [],
          date: date ? new Date(date).toISOString().split('T')[0] : 'No Date',
        };
      }

      if (velo) sessions[sessionId].velocities.push(velo);
      if (dist) sessions[sessionId].distances.push(dist);
    }

    // Calculate stats
    let maxExitVelo = 0;
    let maxDistance = 0;
    let totalHardHits = 0;
    let totalEntries = 0;

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const { velocities, distances, date } = sessions[sessionId];

      if (velocities.length > 0) {
        maxExitVelo = Math.max(maxExitVelo, ...velocities);
        const sessionTotal = velocities.reduce((sum, velo) => sum + velo, 0);
        totalEntries += velocities.length;
        totalHardHits += velocities.filter((velo) => velo >= 95).length;
        const avgExitVelo = sessionTotal / velocities.length;

        if (distances.length > 0) {
          maxDistance = Math.max(maxDistance, ...distances);
        }

        return { sessionId, date, avgExitVelo };
      }

      return { sessionId, date, avgExitVelo: 0 };
    });

    // Hard Hit Average
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
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HitTrax data', details: error.message },
      { status: 500 }
    );
  }
}
