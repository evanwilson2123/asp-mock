import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

/**
 * GET /api/blastMotion/session/:sessionId
 *
 * **Fetch Swing Data for a Specific Session**
 *
 * This endpoint retrieves all swing data for a given session ID,
 * returning all fields from the `blastMotion` table. It also calculates
 * the maximum bat speed and maximum hand speed (using the `batSpeed` and `peakHandSpeed`
 * fields respectively) recorded in that session.
 *
 * ---
 *
 * @param {string} sessionId - The unique identifier of the session for which swing data is requested.
 *
 * Example:
 * ```http
 * GET /api/blastMotion/session/12345
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "swings": [
 *       {
 *         "id": 1,
 *         "sessionId": "12345",
 *         "sessionName": "",
 *         "athlete": "John Doe",
 *         "date": "2023-01-01T00:00:00.000Z",
 *         "swingId": "swing1",
 *         "equipment": null,
 *         "handedness": "right",
 *         "swingDetails": "Some details",
 *         "planeScore": 85.0,
 *         "connectionScore": 90.0,
 *         "rotationScore": 80.0,
 *         "batSpeed": 75.0,
 *         "rotationalAcceleration": 5.0,
 *         "onPlaneEfficiency": 95.0,
 *         "attackAngle": 10.0,
 *         "earlyConnection": 8.0,
 *         "connectionAtImpact": 9.0,
 *         "verticalBatAngle": 12.0,
 *         "power": 100.0,
 *         "timeToContact": 0.25,
 *         "peakHandSpeed": 23.0,
 *         "createdAt": "2023-01-01T00:00:00.000Z",
 *         "updatedAt": "2023-01-01T01:00:00.000Z",
 *         "playLevel": "None"
 *       },
 *       ...
 *     ],
 *     "maxBatSpeed": 80,
 *     "maxHandSpeed": 25
 *   }
 *   ```
 *
 * - **Error (404):**
 *   ```json
 *   {
 *     "error": "No swings found for the given sessionId"
 *   }
 *   ```
 *
 * - **Error (500):**
 *   ```json
 *   {
 *     "error": "Failed to fetch session data",
 *     "details": "Error message here"
 *   }
 *   ```
 */
export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    // Fetch all records for the given sessionId, sorted by creation time
    const swings = await prisma.blastMotion.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    if (!swings || swings.length === 0) {
      return NextResponse.json(
        { error: 'No swings found for the given sessionId' },
        { status: 404 }
      );
    }

    // Calculate maximum bat speed and maximum hand speed (using peakHandSpeed)
    const batSpeeds = swings
      .map((s) => s.batSpeed)
      .filter((s): s is number => s !== null);
    const handSpeeds = swings
      .map((s) => s.peakHandSpeed)
      .filter((s): s is number => s !== null);

    const maxBatSpeed = batSpeeds.length > 0 ? Math.max(...batSpeeds) : 0;
    const maxHandSpeed = handSpeeds.length > 0 ? Math.max(...handSpeeds) : 0;

    // Return all fields from the swing records along with the max values
    return NextResponse.json({
      swings,
      maxBatSpeed,
      maxHandSpeed,
    });
  } catch (error: any) {
    console.error('Error fetching session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data', details: error.message },
      { status: 500 }
    );
  }
}
