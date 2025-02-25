import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

/**
 * GET /api/blastMotion/session/:sessionId
 *
 * **Fetch Swing Data for a Specific Session**
 *
 * This endpoint retrieves all swing data for a given session ID,
 * returning all fields from the `blastMotion` table. It also calculates
 * the maximum bat speed, maximum hand speed, and average values
 * for planeScore, connectionScore, and rotationScore.
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
 *     "swings": [...],
 *     "maxBatSpeed": 80,
 *     "maxHandSpeed": 25,
 *     "avgPlaneScore": 85.2,
 *     "avgConnectionScore": 79.6,
 *     "avgRotationScore": 82.1
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

    // Calculate average planeScore, connectionScore, rotationScore
    const planeScores = swings
      .map((s) => s.planeScore)
      .filter((v): v is number => v !== null);
    const connectionScores = swings
      .map((s) => s.connectionScore)
      .filter((v): v is number => v !== null);
    const rotationScores = swings
      .map((s) => s.rotationScore)
      .filter((v): v is number => v !== null);

    // Helper function to compute average from an array of numbers
    const average = (nums: number[]): number =>
      nums.length > 0
        ? nums.reduce((sum, val) => sum + val, 0) / nums.length
        : 0;

    const avgPlaneScore = average(planeScores);
    const avgConnectionScore = average(connectionScores);
    const avgRotationScore = average(rotationScores);

    // Return all fields plus the computed stats
    return NextResponse.json({
      swings,
      maxBatSpeed,
      maxHandSpeed,
      avgPlaneScore,
      avgConnectionScore,
      avgRotationScore,
    });
  } catch (error: any) {
    console.error('Error fetching session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data', details: error.message },
      { status: 500 }
    );
  }
}
