import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
/**
 * GET /api/hittrax
 *
 * This API endpoint retrieves HitTrax data filtered by the specified play level (e.g., "High School", "College").
 * It calculates the maximum exit velocity, maximum distance, hard-hit rate, and session averages for the provided level.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request containing the query parameter `level` (optional).
 *
 * @queryParam {string} [level="High School"] - The play level to filter the data (e.g., "High School", "College").
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the maximum exit velocity, maximum distance, hard-hit rate, and session averages.
 *   ```json
 *   {
 *     "maxExitVelo": number,
 *     "maxDistance": number,
 *     "hardHitRate": number,
 *     "sessionAverages": [
 *       {
 *         "sessionId": string,
 *         "date": string,
 *         "avgExitVelo": number
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error (404):**
 *   Occurs when no data is found for the specified level.
 *   ```json
 *   { "error": "No HitTrax data found for this level" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during data fetching.
 *   ```json
 *   { "error": "Failed to fetch HitTrax data" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to fetch data for College level
 * GET /api/hittrax?level=College
 *
 * @errorHandling
 * - Returns **404** if no data exists for the specified level.
 * - Returns **500** for any internal server/database issues.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || 'High School'; // Default to "High School"

  try {
    const data = await prisma.hitTrax.findMany({
      where: { playLevel: level },
      orderBy: { date: 'desc' },
    });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No HitTrax data found for this level' },
        { status: 404 }
      );
    }

    const sessions: Record<
      string,
      { velocities: number[]; distances: number[]; date: Date }
    > = {};

    data.forEach((record) => {
      const sessionId = record.sessionId;
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          velocities: [],
          distances: [],
          date: record.date || new Date(),
        };
      }
      if (record.velo) sessions[sessionId].velocities.push(record.velo);
      if (record.dist) sessions[sessionId].distances.push(record.dist);
    });

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const session = sessions[sessionId];
      const avgExitVelo =
        session.velocities.reduce((a, b) => a + b, 0) /
        session.velocities.length;
      return {
        sessionId,
        date: session.date,
        avgExitVelo,
      };
    });

    const maxExitVelo = Math.max(...data.map((record) => record.velo || 0));
    const maxDistance = Math.max(...data.map((record) => record.dist || 0));
    const hardHitRate =
      data.filter((record) => (record.velo || 0) >= 95).length / data.length;

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitRate,
      sessionAverages,
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HitTrax data' },
      { status: 500 }
    );
  }
}
