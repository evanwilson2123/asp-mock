import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

/**
 * GET /api/blastMotion/session/:sessionId
 *
 * **Fetch Swing Data for a Specific Session**
 *
 * This endpoint retrieves all swing data (bat speed and hand speed) for a given session ID.
 * It also calculates the maximum bat speed and hand speed recorded in that session.
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
 *       { "batSpeed": 75, "handSpeed": 23 },
 *       { "batSpeed": 80, "handSpeed": 25 },
 *       ...
 *     ],
 *     "maxBatSpeed": 80,
 *     "maxHandSpeed": 25
 *   }
 *   ```
 *
 * - **Error (404):**
 *   - If no swings are found for the provided session ID:
 *   ```json
 *   {
 *     "error": "No swings found for the given sessionId"
 *   }
 *   ```
 *
 * - **Error (500):**
 *   - If there's an internal server error during the data fetch process:
 *   ```json
 *   {
 *     "error": "Failed to fetch session data",
 *     "details": "Error message here"
 *   }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/blastMotion/session/12345')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching session data:', error));
 *
 * ---
 *
 * @notes
 * - Ensure that the `sessionId` parameter is provided in the request URL.
 * - The endpoint fetches data from the `blastMotion` table in the Prisma database.
 * - The data is sorted chronologically by the `createdAt` timestamp.
 * - Bat speed and hand speed values are filtered to exclude null entries before calculating the maximum values.
 */

export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    // Fetch all records for the given sessionId
    const swings = await prisma.blastMotion.findMany({
      where: { sessionId },
      select: {
        batSpeed: true,
        peakHandSpeed: true, // Fetch the correct field name from the database
      },
      orderBy: { createdAt: 'asc' }, // Sort swings chronologically
    });

    if (!swings || swings.length === 0) {
      return NextResponse.json(
        { error: 'No swings found for the given sessionId' },
        { status: 404 }
      );
    }

    // Rename `peakHandSpeed` to `handSpeed` in the response
    const transformedSwings = swings.map((s) => ({
      batSpeed: s.batSpeed,
      handSpeed: s.peakHandSpeed, // Map the correct field
    }));

    // Extract bat speeds and hand speeds for max calculations
    const batSpeeds = transformedSwings
      .map((s) => s.batSpeed)
      .filter((s): s is number => s !== null);
    const handSpeeds = transformedSwings
      .map((s) => s.handSpeed)
      .filter((s): s is number => s !== null);

    // Calculate max values
    const maxBatSpeed = batSpeeds.length > 0 ? Math.max(...batSpeeds) : 0;
    const maxHandSpeed = handSpeeds.length > 0 ? Math.max(...handSpeeds) : 0;

    return NextResponse.json({
      swings: transformedSwings,
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
