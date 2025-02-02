import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

/**
 * GET /api/hittrax/session/:sessionId
 *
 * **Fetch HitTrax Session Data**
 *
 * This endpoint retrieves all valid HitTrax hit records for a given session ID. It filters out invalid hits
 * (where `velo` or `dist` is 0 or null) and calculates key statistics such as maximum exit velocity,
 * maximum distance, and average launch angle.
 *
 * ---
 *
 * @param {NextRequest} req - The request object containing the session ID in the URL parameters.
 *
 * **Path Parameter:**
 * - `sessionId` (string) **Required**: The unique identifier for the session to fetch hits from.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   Returns the list of hits with key metrics:
 *   ```json
 *   {
 *     "hits": [
 *       { "velo": 85, "dist": 300, "LA": 25 },
 *       { "velo": 90, "dist": 320, "LA": 28 }
 *     ],
 *     "maxExitVelo": 90,
 *     "maxDistance": 320,
 *     "avgLaunchAngle": 26.5
 *   }
 *   ```
 *
 * - **Error (404):**
 *   - If no hits are found for the session:
 *   ```json
 *   {
 *     "error": "No hits found for the given sessionId"
 *   }
 *   ```
 *   - If no valid hits (non-zero values) are found:
 *   ```json
 *   {
 *     "error": "No valid hits found for the given sessionId"
 *   }
 *   ```
 *
 * - **Error (500):**
 *   - If there's an internal server error:
 *   ```json
 *   {
 *     "error": "Failed to fetch session data",
 *     "details": "Error message"
 *   }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/hittrax/session/12345', {
 *   method: 'GET'
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching session data:', error));
 *
 * ---
 *
 * @notes
 * - This endpoint filters out invalid hits where both `velo` and `dist` are either 0 or null.
 * - The average launch angle (`avgLaunchAngle`) is calculated only from valid hits with non-null values.
 * - Sorting is done chronologically by the `createdAt` timestamp in ascending order.
 */
export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    // Fetch all records for the given sessionId
    const hits = await prisma.hitTrax.findMany({
      where: { sessionId },
      select: {
        velo: true,
        dist: true,
        LA: true, // Include Launch Angle (LA)
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!hits || hits.length === 0) {
      return NextResponse.json(
        { error: 'No hits found for the given sessionId' },
        { status: 404 }
      );
    }

    // Filter out hits where velo or dist is 0
    const filteredHits = hits.filter(
      (h) => h.velo !== 0 && h.dist !== 0 && h.velo !== null && h.dist !== null
    );

    if (filteredHits.length === 0) {
      return NextResponse.json(
        { error: 'No valid hits found for the given sessionId' },
        { status: 404 }
      );
    }

    // Extract exit velocities, distances, and launch angles for calculations
    const exitVelocities = filteredHits
      .map((h) => h.velo)
      .filter((v): v is number => v !== null);
    const distances = filteredHits
      .map((h) => h.dist)
      .filter((d): d is number => d !== null);
    const launchAngles = filteredHits
      .map((h) => h.LA)
      .filter((la): la is number => la !== null);

    // Calculate max values
    const maxExitVelo =
      exitVelocities.length > 0 ? Math.max(...exitVelocities) : 0;
    const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;
    let laCount = 0;
    let laTotal = 0;
    for (let i = 0; i < launchAngles.length; i++) {
      laCount++;
      laTotal += launchAngles[i];
    }
    const avgLaunchAngle = laTotal / laCount;
    // const avgLaunchAngle =
    //   launchAngles.length > 0 ? Math.max(...launchAngles) : 0;

    return NextResponse.json({
      hits: filteredHits,
      maxExitVelo,
      maxDistance,
      avgLaunchAngle,
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data', details: error.message },
      { status: 500 }
    );
  }
}
