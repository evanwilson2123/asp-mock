import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/trackman/:athleteId
 *
 * This API endpoint retrieves **Trackman** data for a specific athlete. It provides:
 * - **Peak velocity** by pitch type (maximum speed recorded for each pitch type)
 * - **Average pitch speed** over time, grouped by date and pitch type
 * - **Clickable session metadata** (session IDs and dates) for navigation and charting
 *
 * ---
 *
 * @auth
 * - **No authentication required** (if needed, authentication can be added with Clerk).
 *
 * ---
 *
 * @pathParam {string} athleteId - The unique ID of the athlete whose Trackman data is being requested.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the peak velocity stats, average pitch speeds, and session information for the athlete.
 *   ```json
 *   {
 *     "pitchStats": [
 *       { "pitchType": "Fastball", "peakSpeed": 95 },
 *       { "pitchType": "Slider", "peakSpeed": 85 }
 *     ],
 *     "avgPitchSpeeds": [
 *       { "date": "2024-05-01", "pitchType": "Fastball", "avgSpeed": 90 },
 *       { "date": "2024-05-01", "pitchType": "Slider", "avgSpeed": 82 }
 *     ],
 *     "sessions": [
 *       { "sessionId": "sess_001", "date": "2024-05-01" },
 *       { "sessionId": "sess_002", "date": "2024-06-01" }
 *     ]
 *   }
 *   ```
 *
 * - **Error (404):**
 *   Occurs when no Trackman data is found for the specified athlete.
 *   ```json
 *   { "error": "No data found for this athlete." }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during data fetching.
 *   ```json
 *   { "error": "Internal Server Error", "details": "Error message details" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to fetch Trackman data for an athlete
 * GET /api/trackman/athlete_12345
 *
 * @errorHandling
 * - Returns **404** if no Trackman data exists for the athlete.
 * - Returns **500** for internal server/database errors.
 */
export async function GET(req: NextRequest, context: any) {
  const athleteId = context.params.athleteId;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }

  console.log(req);

  try {
    // Fetch all Trackman data for the athlete
    const sessions = await prisma.trackman.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'asc' },
    });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'No data found for this athlete.' },
        { status: 404 }
      );
    }

    // Prepare peak velocity by pitch type
    const pitchStats: { [key: string]: number } = {};

    // Prepare average velocity over time by pitch type
    const avgPitchSpeedsByType: {
      [date: string]: { [pitchType: string]: number[] };
    } = {};

    // Collect sessions for navigation
    const sessionMap: Record<string, { sessionId: string; date: string }> = {};

    sessions.forEach((session) => {
      const { sessionId, pitchType, pitchReleaseSpeed, createdAt } = session;

      // Add sessionId and date for clickable sessions
      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          sessionId,
          date: new Date(createdAt).toISOString().split('T')[0],
        };
      }

      if (pitchType && pitchReleaseSpeed) {
        const speed = pitchReleaseSpeed;

        // Calculate peak velocity for each pitch type
        if (!pitchStats[pitchType] || pitchStats[pitchType] < speed) {
          pitchStats[pitchType] = speed;
        }

        // Prepare average velocity over time by pitch type
        const date = new Date(createdAt).toISOString().split('T')[0];

        if (!avgPitchSpeedsByType[date]) {
          avgPitchSpeedsByType[date] = {};
        }

        if (!avgPitchSpeedsByType[date][pitchType]) {
          avgPitchSpeedsByType[date][pitchType] = [];
        }

        avgPitchSpeedsByType[date][pitchType].push(speed);
      }
    });

    // Format average pitch speeds data
    const avgPitchSpeeds = Object.entries(avgPitchSpeedsByType).flatMap(
      ([date, pitches]) =>
        Object.entries(pitches).map(([pitchType, speeds]) => ({
          date,
          pitchType,
          avgSpeed:
            speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length,
        }))
    );

    // Format pitch stats
    const formattedPitchStats = Object.entries(pitchStats).map(
      ([pitchType, peakSpeed]) => ({
        pitchType,
        peakSpeed,
      })
    );

    // Convert session map to array for clickable sessions
    const clickableSessions = Object.values(sessionMap);

    return NextResponse.json({
      pitchStats: formattedPitchStats,
      avgPitchSpeeds,
      sessions: clickableSessions, // List of clickable sessions
    });
  } catch (error: any) {
    console.error('Error fetching Trackman data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
